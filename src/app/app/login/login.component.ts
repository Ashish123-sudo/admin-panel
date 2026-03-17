import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  form!: FormGroup;
  error = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login() {
    const { email, password } = this.form.value;

    if (!email && !password) { this.error = 'Please enter your username and password'; return; }
    if (!email) { this.error = 'Please enter your username'; return; }
    if (!password) { this.error = 'Please enter your password'; return; }

    this.isLoading = true;
    this.error = '';

    this.auth.login(email, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/quotes']);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.error?.error || 'Invalid credentials';
      }
    });
  }
}