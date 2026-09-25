import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatRequestMessage } from '../../services/chatbot.service';

interface ChatMessage { text: string; from: 'user' | 'ai'; }

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class ChatbotComponent {
  private readonly chatbotService = inject(ChatbotService);
  readonly messages = signal<ChatMessage[]>([
    { text: 'Hi! I’m Ledgerly. Ask me anything about building better spending habits.', from: 'ai' },
  ]);
  readonly draft = signal('');
  readonly loading = signal(false);
  readonly error = signal('');

  send(): void {
    const text = this.draft().trim();
    if (!text || this.loading()) return;
    this.messages.update(messages => [...messages, { text, from: 'user' }]);
    this.draft.set('');
    this.error.set('');
    this.loading.set(true);
    const conversation: ChatRequestMessage[] = this.messages()
      .slice(1)
      .slice(-20)
      .map(message => ({
        role: message.from === 'user' ? 'user' : 'assistant',
        content: message.text,
      }));

    this.chatbotService.sendMessage(conversation).subscribe({
      next: response => {
        this.messages.update(messages => [...messages, { text: response.reply, from: 'ai' }]);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        const message = error instanceof HttpErrorResponse
          ? typeof error.error?.error === 'string'
            ? error.error.error
            : error.status === 0 || (error.status === 502 && typeof error.error === 'string')
              ? 'The chatbot server is not running. Start it in another terminal with "npm run api". For AI replies, add GROQ_API_KEY to .env first.'
              : 'Unable to reach the AI assistant. Check your internet connection and try again.'
          : 'Unable to reach the AI assistant. Please try again.';
        this.error.set(message);
        this.loading.set(false);
      },
    });
  }
}
