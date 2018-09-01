import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Store } from '@ngrx/store';
import { AppState } from '../../../interfaces';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getAuthStatus } from '../../reducers/selectors';
import { AuthActions } from '../../actions/auth.actions';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit, OnDestroy {
  signUpForm: FormGroup;
  formSubmit = false;
  title = environment.appName;
  registerSubs: Subscription;

  constructor(
    private fb: FormBuilder,
    private actions: AuthActions,
    private store: Store<AppState>,
    private router: Router,
    private authService: AuthService
  ) {
    this.redirectIfUserLoggedIn();
  }

  ngOnInit() {
    this.initForm();
  }

  onSubmit() {
    const values = this.signUpForm.value;
    const keys = Object.keys(values);
    this.formSubmit = true;

    if (this.signUpForm.valid) {
      this.registerSubs = this.authService
        .register(values).pipe(
          tap(_ => _, (user) => {
            const errors = user.error.errors || {};
            keys.forEach(val => {
              if (errors[val]) { this.pushErrorFor(val, errors[val][0]); };
            });
          })).subscribe();
    } else {
      keys.forEach(val => {
        const ctrl = this.signUpForm.controls[val];
        if (!ctrl.valid) {
          this.pushErrorFor(val, null);
          ctrl.markAsTouched();
        };
      });
    }
  }

  private pushErrorFor(ctrl_name: string, msg: string) {
    this.signUpForm.controls[ctrl_name].setErrors({ 'msg': msg });
  }

  initForm() {
    const email = '';
    const password = '';
    const password_confirmation = '';
    const mobile = '';
    const gender = '';

    this.signUpForm = this.fb.group({
      'email': [email, Validators.compose([Validators.required, Validators.email])],
      'password': [password, Validators.compose([Validators.required, Validators.minLength(6)])],
      'password_confirmation': [password_confirmation, Validators.compose([Validators.required, Validators.minLength(6)])],
      'mobile': [
        mobile,
        Validators.compose([
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
          Validators.pattern('[0-9]{10}')
        ])],
      'gender': [gender, Validators.required]
    }, { validator: this.matchingPasswords('password', 'password_confirmation') }
    );
  }

  redirectIfUserLoggedIn() {
    this.store.select(getAuthStatus).subscribe(
      data => {
        if (data === true) { this.router.navigateByUrl('/'); }
      }
    );
  }

  ngOnDestroy() {
    if (this.registerSubs) { this.registerSubs.unsubscribe(); }
  }

  matchingPasswords(passwordKey: string, confirmPasswordKey: string) {
    return (group: FormGroup): { [key: string]: boolean } => {
      const password = group.controls[passwordKey];
      const confirmPassword = group.controls[confirmPasswordKey];

      return {
        mismatchedPasswords: password.value !== confirmPassword.value
      };
    }
  }

  socialLogin(provider: string) {
    this.store.dispatch(this.actions.oAuthLogin(provider));
  }
}
