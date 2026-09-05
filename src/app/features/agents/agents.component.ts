import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { UserSummary } from '../../core/models/models';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.scss']
})
export class AgentsComponent implements OnInit {
  chat = inject(ChatService);
  router = inject(Router);

  searchTerm = '';

  filteredAgents = computed(() => {
    const list = this.chat.contacts();
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return list;
    return list.filter(c => 
      (c.fullName || '').toLowerCase().includes(query) ||
      (c.employeeId || '').toLowerCase().includes(query) ||
      (c.designation || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.chat.fetchContacts().subscribe();
  }

  startChat(agent: UserSummary) {
    this.chat.startDirectChat(agent.id).subscribe(() => {
      this.router.navigate(['/chat']);
    });
  }

  meetAgent(agent: UserSummary) {
    this.router.navigate(['/meetings/room', 'pj-' + Math.random().toString(36).substring(2, 8)]);
  }

  deleteAgent(agent: UserSummary, event: Event) {
    event.stopPropagation();
    if (confirm(`Remove ${agent.fullName} (${agent.employeeId}) from directory?`)) {
      this.chat.deleteContact(agent.id).subscribe();
    }
  }
}
