import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Conversation, Message, UserSummary } from '../../../core/models/models';

@Component({
  selector: 'app-chat-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-workspace.component.html',
  styleUrls: ['./chat-workspace.component.scss']
})
export class ChatWorkspaceComponent implements OnInit {
  chat = inject(ChatService);
  auth = inject(AuthService);
  ws = inject(WebSocketService);
  router = inject(Router);

  @ViewChild('messagesScroll') messagesScroll!: ElementRef;

  notif = inject(NotificationService);

  searchQuery = signal<string>('');
  filterType = signal<'ALL' | 'UNREAD' | 'GROUPS'>('ALL');
  messageInput = signal<string>('');
  
  // UI Panels
  showInfoDrawer = signal<boolean>(false);
  showAttachmentSheet = signal<boolean>(false);
  activeReactionMessageId = signal<string | null>(null);
  
  // Modals
  showGroupModal = signal<boolean>(false);
  showNewChatModal = signal<boolean>(false);
  showAddContactModal = signal<boolean>(false);
  showAddParticipantsModal = signal<boolean>(false);
  contactSearchQuery = signal<string>('');
  
  // New Contact Form
  newContactName = '';
  newContactEmpId = '';
  newContactEmail = '';
  newContactDesignation = '';
  newContactPhone = '';
  isAddingContact = signal<boolean>(false);
  contactToast = signal<string>('');

  // Group Form & Members Management
  groupName = '';
  groupDescription = '';
  selectedMemberIds = signal<string[]>([]);
  groupMembers = signal<any[]>([]);
  selectedNewMemberIds = signal<string[]>([]);
  isAddingParticipants = signal<boolean>(false);

  // Emoji Reactions List
  emojis = ['👍', '❤️', '😂', '🔥', '🎉', '🙏'];

  // Filtered conversation list
  filteredConversations = computed(() => {
    let list = this.chat.conversations();
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.filterType();

    if (query) {
      list = list.filter(c => 
        (c.title || '').toLowerCase().includes(query) ||
        (c.lastMessage?.content || '').toLowerCase().includes(query)
      );
    }

    if (filter === 'UNREAD') {
      list = list.filter(c => (c.unreadCount || 0) > 0);
    } else if (filter === 'GROUPS') {
      list = list.filter(c => c.type === 'GROUP' || (c as any).isGroup);
    }

    return list;
  });

  // Filtered contacts list
  filteredContacts = computed(() => {
    const list = this.chat.contacts();
    const query = this.contactSearchQuery().trim().toLowerCase();
    if (!query) return list;

    return list.filter(c => 
      (c.fullName || '').toLowerCase().includes(query) ||
      (c.employeeId || '').toLowerCase().includes(query) ||
      (c.designation || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query)
    );
  });

  // Available contacts not yet in active group
  availableContactsForGroup = computed(() => {
    const all = this.chat.contacts();
    const currentMemberIds = this.groupMembers().map(m => m.id);
    return all.filter(c => !currentMemberIds.includes(c.id));
  });

  ngOnInit() {
    this.ws.connect();
    this.notif.requestPermission();
    this.chat.fetchConversations().subscribe();
    this.chat.fetchContacts().subscribe();

    // Real-time incoming messages
    this.ws.messages$.subscribe((data) => {
      if (data && data.message) {
        const active = this.chat.activeConversation();
        if (active && (active.id === data.conversationId || active.id === data.message.conversationId)) {
          const currentMsgs = this.chat.activeMessages();
          if (!currentMsgs.some(m => m.id === data.message.id)) {
            this.chat.activeMessages.set([...currentMsgs, data.message]);
            this.scrollToBottom();
          }
        }
        // Refresh conversation sidebar
        this.chat.fetchConversations().subscribe();
      }
    });

    // Real-time targeted notifications
    this.ws.notifications$.subscribe((notifData) => {
      if (notifData) {
        this.notif.addIncomingNotification(notifData);
        this.contactToast.set(`🔔 ${notifData.title}: ${notifData.body}`);
        setTimeout(() => this.contactToast.set(''), 4000);
      }
    });

    // Real-time typing indicators
    this.ws.typing$.subscribe((data) => {
      if (data && data.isTyping) {
        this.chat.activeTypingUser.set(data.userId);
        setTimeout(() => this.chat.activeTypingUser.set(null), 3000);
      } else {
        this.chat.activeTypingUser.set(null);
      }
    });
  }

  isCurrentUserSender(msg: any): boolean {
    const current = this.auth.currentUser();
    if (!current || !msg) return false;
    const senderId = msg.sender?.id || msg.senderId;
    const senderEmpId = msg.sender?.employeeId;
    return senderId === current.id || senderEmpId === current.employeeId;
  }

  deleteConversation(conv: Conversation, event: Event) {
    event.stopPropagation();
    const label = conv.type === 'GROUP' ? `group "${conv.title}"` : `chat with "${conv.title}"`;
    if (confirm(`Delete ${label}? All messages will be permanently deleted.`)) {
      if (conv.type === 'GROUP' && conv.groupId) {
        this.chat.deleteGroup(conv.groupId).subscribe({
          next: () => {
            this.contactToast.set(`🗑️ ${label} deleted.`);
            setTimeout(() => this.contactToast.set(''), 3000);
          }
        });
      } else {
        this.chat.deleteConversation(conv.id).subscribe({
          next: () => {
            this.contactToast.set(`🗑️ ${label} deleted.`);
            setTimeout(() => this.contactToast.set(''), 3000);
          }
        });
      }
    }
  }

  openNewChat() {
    this.contactSearchQuery.set('');
    this.chat.fetchContacts().subscribe();
    this.showNewChatModal.set(true);
  }

  openAddContact() {
    this.newContactName = '';
    this.newContactEmpId = '';
    this.newContactEmail = '';
    this.newContactDesignation = '';
    this.newContactPhone = '';
    this.contactToast.set('');
    this.showAddContactModal.set(true);
  }

  submitAddContact() {
    if (!this.newContactName.trim() || !this.newContactEmpId.trim()) return;
    this.isAddingContact.set(true);

    this.chat.addContact({
      fullName: this.newContactName.trim(),
      employeeId: this.newContactEmpId.trim(),
      email: this.newContactEmail.trim() || undefined,
      designation: this.newContactDesignation.trim() || 'EMS Specialist',
      phone: this.newContactPhone.trim() || undefined
    }).subscribe({
      next: (res) => {
        this.isAddingContact.set(false);
        if (res.success) {
          this.showAddContactModal.set(false);
          this.chat.fetchContacts().subscribe();
          this.contactToast.set('✅ EMS Contact Added Successfully!');
          setTimeout(() => this.contactToast.set(''), 3500);
        } else {
          this.contactToast.set(`⚠️ ${res.message}`);
          setTimeout(() => this.contactToast.set(''), 3500);
        }
      },
      error: () => {
        this.isAddingContact.set(false);
        this.contactToast.set('⚠️ Error adding EMS contact');
        setTimeout(() => this.contactToast.set(''), 3500);
      }
    });
  }

  deleteContact(contact: UserSummary, event: Event) {
    event.stopPropagation();
    if (confirm(`Remove ${contact.fullName} (${contact.employeeId}) from EMS directory?`)) {
      this.chat.deleteContact(contact.id).subscribe({
        next: () => {
          this.chat.fetchContacts().subscribe();
          this.contactToast.set(`🗑️ Contact ${contact.fullName} removed.`);
          setTimeout(() => this.contactToast.set(''), 3000);
        }
      });
    }
  }

  selectConversation(conv: Conversation) {
    this.chat.selectConversation(conv);
    this.showInfoDrawer.set(false);
    if (conv.groupId) {
      this.loadGroupMembers(conv.groupId);
    }
    this.scrollToBottom();
  }

  openConversationInfo() {
    const conv = this.chat.activeConversation();
    if (!conv) return;
    if (conv.groupId) {
      this.loadGroupMembers(conv.groupId);
    }
    this.showInfoDrawer.set(true);
  }

  loadGroupMembers(groupId: string) {
    this.chat.fetchGroupMembers(groupId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.groupMembers.set(res.data);
        }
      }
    });
  }

  openAddParticipantsModal() {
    this.selectedNewMemberIds.set([]);
    this.chat.fetchContacts().subscribe();
    this.showAddParticipantsModal.set(true);
  }

  toggleNewMemberSelection(id: string) {
    const cur = this.selectedNewMemberIds();
    if (cur.includes(id)) {
      this.selectedNewMemberIds.set(cur.filter(m => m !== id));
    } else {
      this.selectedNewMemberIds.set([...cur, id]);
    }
  }

  submitAddParticipants() {
    const conv = this.chat.activeConversation();
    if (!conv || !conv.groupId || this.selectedNewMemberIds().length === 0) return;
    this.isAddingParticipants.set(true);

    this.chat.addGroupMembers(conv.groupId, this.selectedNewMemberIds()).subscribe({
      next: () => {
        this.isAddingParticipants.set(false);
        this.showAddParticipantsModal.set(false);
        this.selectedNewMemberIds.set([]);
        if (conv.groupId) {
          this.loadGroupMembers(conv.groupId);
        }
      },
      error: () => {
        this.isAddingParticipants.set(false);
      }
    });
  }

  removeParticipant(userId: string) {
    const conv = this.chat.activeConversation();
    if (!conv || !conv.groupId) return;
    if (confirm('Remove this participant from group?')) {
      this.chat.removeGroupMember(conv.groupId, userId).subscribe({
        next: () => {
          if (conv.groupId) {
            this.loadGroupMembers(conv.groupId);
          }
        }
      });
    }
  }

  deleteCurrentGroup() {
    const conv = this.chat.activeConversation();
    if (!conv || !conv.groupId) return;
    if (confirm(`Are you sure you want to delete group "${conv.title}"? All messages and members will be removed.`)) {
      this.chat.deleteGroup(conv.groupId).subscribe({
        next: () => {
          this.showInfoDrawer.set(false);
          this.contactToast.set(`🗑️ Group "${conv.title}" deleted.`);
          setTimeout(() => this.contactToast.set(''), 3000);
        }
      });
    }
  }

  backToChatList() {
    this.chat.activeConversation.set(null);
  }

  sendMessage() {
    const text = this.messageInput().trim();
    if (!text) return;
    this.chat.sendMessage(text).subscribe(() => {
      this.messageInput.set('');
      this.scrollToBottom();
    });
  }

  sendVoiceNote() {
    this.chat.sendMessage('🎤 Voice Note (0:12)', 'AUDIO' as any).subscribe(() => {
      this.scrollToBottom();
    });
  }

  sendQuickAttachment(type: string) {
    this.showAttachmentSheet.set(false);
    if (type === 'PHOTO') {
      this.chat.sendMessage('📷 Shared a photo', 'IMAGE' as any).subscribe(() => this.scrollToBottom());
    } else if (type === 'DOC') {
      this.chat.sendMessage('📄 Shared an official EMS document.pdf', 'FILE' as any).subscribe(() => this.scrollToBottom());
    }
  }

  addReaction(msgId: string, emoji: string) {
    this.chat.addReaction(msgId, emoji).subscribe();
    this.activeReactionMessageId.set(null);
  }

  toggleReactionPicker(msgId: string, event: MouseEvent) {
    event.stopPropagation();
    if (this.activeReactionMessageId() === msgId) {
      this.activeReactionMessageId.set(null);
    } else {
      this.activeReactionMessageId.set(msgId);
    }
  }

  startDirectChat(contact: UserSummary) {
    this.chat.startDirectChat(contact.id).subscribe(() => {
      this.showNewChatModal.set(false);
      this.scrollToBottom();
    });
  }

  startMeeting() {
    const code = 'pj-' + Math.random().toString(36).substring(2, 8);
    this.router.navigate(['/meetings/room', code]);
  }

  toggleMemberSelection(id: string) {
    const current = this.selectedMemberIds();
    if (current.includes(id)) {
      this.selectedMemberIds.set(current.filter(m => m !== id));
    } else {
      this.selectedMemberIds.set([...current, id]);
    }
  }

  openNewGroup() {
    this.groupName = '';
    this.groupDescription = '';
    this.selectedMemberIds.set([]);
    this.chat.fetchContacts().subscribe();
    this.showGroupModal.set(true);
  }

  createGroup() {
    if (!this.groupName.trim()) return;
    this.chat.createGroup(this.groupName, this.groupDescription, this.selectedMemberIds()).subscribe({
      next: () => {
        this.showGroupModal.set(false);
        this.groupName = '';
        this.groupDescription = '';
        this.selectedMemberIds.set([]);
      },
      error: (err) => {
        console.error('Error creating group', err);
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesScroll) {
        this.messagesScroll.nativeElement.scrollTop = this.messagesScroll.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
