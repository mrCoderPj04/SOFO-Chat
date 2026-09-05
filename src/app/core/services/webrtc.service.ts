import { Injectable, signal, inject } from '@angular/core';
import { WebSocketService } from './websocket.service';
import { AuthService } from './auth.service';

export interface PeerStream {
  peerId: string;
  peerName: string;
  stream: MediaStream;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebRtcService {
  private ws = inject(WebSocketService);
  private auth = inject(AuthService);

  localStream = signal<MediaStream | null>(null);
  screenStream = signal<MediaStream | null>(null);
  peerStreams = signal<PeerStream[]>([]);

  isAudioMuted = signal<boolean>(false);
  isVideoOff = signal<boolean>(false);
  isScreenSharing = signal<boolean>(false);

  private peers: Map<string, RTCPeerConnection> = new Map();
  private roomId: string = '';

  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  async initializeMedia(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      this.localStream.set(stream);
      return stream;
    } catch (e) {
      console.warn('Could not access camera/mic, fallback to audio only or blank track', e);
      // Create empty canvas stream fallback if camera denied
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 640, 480);
      }
      const stream = canvas.captureStream(10);
      this.localStream.set(stream);
      return stream;
    }
  }

  joinRoom(roomId: string) {
    this.roomId = roomId;
    const user = this.auth.currentUser();
    if (!user) return;

    this.ws.subscribeToMeeting(roomId, user.id);

    // Listen to signals
    this.ws.webrtcSignal$.subscribe(signal => {
      this.handleSignal(signal);
    });

    // Notify room of join
    this.ws.sendSignal({
      type: 'user-joined',
      roomId,
      senderId: user.id,
      senderName: user.fullName,
      senderAvatar: user.avatarUrl
    });
  }

  private async handleSignal(signal: any) {
    const user = this.auth.currentUser();
    if (!user || signal.senderId === user.id) return;

    switch (signal.type) {
      case 'user-joined':
        this.createPeerConnection(signal.senderId, signal.senderName, true);
        break;
      case 'offer':
        await this.handleOffer(signal);
        break;
      case 'answer':
        await this.handleAnswer(signal);
        break;
      case 'ice-candidate':
        await this.handleCandidate(signal);
        break;
      case 'user-left':
        this.removePeer(signal.senderId);
        break;
      case 'toggle-media':
        this.updatePeerMediaStatus(signal);
        break;
    }
  }

  private createPeerConnection(peerId: string, peerName: string, isInitiator: boolean): RTCPeerConnection {
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId)!;
    }

    const pc = new RTCPeerConnection(this.rtcConfig);
    this.peers.set(peerId, pc);

    const local = this.localStream();
    if (local) {
      local.getTracks().forEach(track => pc.addTrack(track, local));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.ws.sendSignal({
          type: 'ice-candidate',
          roomId: this.roomId,
          targetId: peerId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      this.peerStreams.update(peers => {
        const idx = peers.findIndex(p => p.peerId === peerId);
        if (idx >= 0) {
          peers[idx].stream = stream;
          return [...peers];
        } else {
          return [...peers, {
            peerId,
            peerName,
            stream,
            isMuted: false,
            isVideoOff: false,
            isScreenSharing: false
          }];
        }
      });
    };

    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          this.ws.sendSignal({
            type: 'offer',
            roomId: this.roomId,
            targetId: peerId,
            sdp: pc.localDescription
          });
        } catch (err) {
          console.error('Error creating offer', err);
        }
      };
    }

    return pc;
  }

  private async handleOffer(signal: any) {
    const pc = this.createPeerConnection(signal.senderId, signal.senderName, false);
    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.ws.sendSignal({
      type: 'answer',
      roomId: this.roomId,
      targetId: signal.senderId,
      sdp: pc.localDescription
    });
  }

  private async handleAnswer(signal: any) {
    const pc = this.peers.get(signal.senderId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    }
  }

  private async handleCandidate(signal: any) {
    const pc = this.peers.get(signal.senderId);
    if (pc && signal.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      } catch (e) {
        console.error('Error adding ICE candidate', e);
      }
    }
  }

  toggleAudio() {
    const stream = this.localStream();
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      const current = this.isAudioMuted();
      audioTracks.forEach(t => t.enabled = current);
      this.isAudioMuted.set(!current);
      this.broadcastMediaStatus();
    }
  }

  toggleVideo() {
    const stream = this.localStream();
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      const current = this.isVideoOff();
      videoTracks.forEach(t => t.enabled = current);
      this.isVideoOff.set(!current);
      this.broadcastMediaStatus();
    }
  }

  async toggleScreenShare() {
    if (this.isScreenSharing()) {
      this.stopScreenShare();
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        this.screenStream.set(screen);
        this.isScreenSharing.set(true);

        const screenTrack = screen.getVideoTracks()[0];
        screenTrack.onended = () => this.stopScreenShare();

        // Replace track on peer connections
        this.peers.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        this.broadcastMediaStatus();
      } catch (e) {
        console.warn('Screen share cancelled', e);
      }
    }
  }

  private stopScreenShare() {
    const screen = this.screenStream();
    if (screen) {
      screen.getTracks().forEach(t => t.stop());
      this.screenStream.set(null);
    }
    this.isScreenSharing.set(false);

    // Revert to camera video track
    const local = this.localStream();
    if (local) {
      const videoTrack = local.getVideoTracks()[0];
      this.peers.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });
    }

    this.broadcastMediaStatus();
  }

  private broadcastMediaStatus() {
    const user = this.auth.currentUser();
    if (!user) return;

    this.ws.sendSignal({
      type: 'toggle-media',
      roomId: this.roomId,
      senderId: user.id,
      isMuted: this.isAudioMuted(),
      isVideoOff: this.isVideoOff(),
      isScreenSharing: this.isScreenSharing()
    });
  }

  private updatePeerMediaStatus(signal: any) {
    this.peerStreams.update(peers =>
      peers.map(p => {
        if (p.peerId === signal.senderId) {
          return {
            ...p,
            isMuted: signal.isMuted ?? p.isMuted,
            isVideoOff: signal.isVideoOff ?? p.isVideoOff,
            isScreenSharing: signal.isScreenSharing ?? p.isScreenSharing
          };
        }
        return p;
      })
    );
  }

  private removePeer(peerId: string) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
    this.peerStreams.update(peers => peers.filter(p => p.peerId !== peerId));
  }

  leave() {
    const user = this.auth.currentUser();
    if (user && this.roomId) {
      this.ws.sendSignal({
        type: 'user-left',
        roomId: this.roomId,
        senderId: user.id
      });
    }

    if (this.localStream()) {
      this.localStream()?.getTracks().forEach(t => t.stop());
      this.localStream.set(null);
    }

    if (this.screenStream()) {
      this.screenStream()?.getTracks().forEach(t => t.stop());
      this.screenStream.set(null);
    }

    this.peers.forEach(pc => pc.close());
    this.peers.clear();
    this.peerStreams.set([]);
    this.roomId = '';
  }
}
