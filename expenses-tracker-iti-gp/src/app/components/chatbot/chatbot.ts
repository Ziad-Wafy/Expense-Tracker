import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ChatMessage { text: string; from: 'user' | 'ai'; }

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class ChatbotComponent {
  readonly messages = signal<ChatMessage[]>([
    { text: 'Hi! I’m Ledgerly. Ask me anything about building better spending habits.', from: 'ai' },
  ]);
  readonly draft = signal('');
  readonly loading = signal(false);

  send(): void {
    const text = this.draft().trim();
    if (!text || this.loading()) return;
    this.messages.update(messages => [...messages, { text, from: 'user' }]);
    this.draft.set('');
    this.loading.set(true);
    // TODO: replace with real AI API call
    setTimeout(() => {
      this.messages.update(messages => [...messages, { text: `Great question! I’m still learning, but I hear you: “${text}”`, from: 'ai' }]);
      this.loading.set(false);
    }, 700);
  }
}
