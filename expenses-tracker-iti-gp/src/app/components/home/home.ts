import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChatbotComponent } from '../chatbot/chatbot';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ChatbotComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {}
