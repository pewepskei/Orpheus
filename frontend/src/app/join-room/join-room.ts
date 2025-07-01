import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-join-room',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './join-room.html',
  styleUrl: './join-room.scss'
})
export class JoinRoom {
  code = new FormControl('', [Validators.required]);

  constructor(private router: Router) {}

  enterRoom() {
    const value = this.code.value?.trim();
    if (value) {
      this.router.navigate(['/room', value.toUpperCase()]);
    }
  }
}
