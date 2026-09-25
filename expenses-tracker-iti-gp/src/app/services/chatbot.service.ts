import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ChatRequestMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  reply: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly http = inject(HttpClient);

  sendMessage(messages: ChatRequestMessage[]): Observable<ChatResponse> {
    return this.http.post<ChatResponse>('/api/chat', { messages });
  }
}
