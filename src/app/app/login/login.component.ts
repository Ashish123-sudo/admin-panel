import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,MatIconModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  form!: FormGroup;
  error = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {

    // ✅ Initialize form HERE
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

  }

  login() {
  const { email, password } = this.form.value;

  if (!email && !password) {
    this.error = 'Please enter your email and password';
    return;
  }

  if (!email) {
    this.error = 'Please enter your email address';
    return;
  }

  if (!password) {
    this.error = 'Please enter your password';
    return;
  }

  if (this.form.invalid) {
    this.error = 'Please enter a valid email address';
    return;
  }

  if (this.auth.login(email, password)) {
    this.router.navigate(['/customers']);
  } else {
    this.error = 'Invalid credentials';
  }
}
}
