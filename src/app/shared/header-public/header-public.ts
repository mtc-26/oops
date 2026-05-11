import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OopsLogo } from '../oops-logo/oops-logo';
import { AuthService } from '../../data/auth.service';

@Component({
  selector: 'app-header-public',
  imports: [RouterLink, OopsLogo],
  templateUrl: './header-public.html',
  styleUrl: './header-public.scss',
})
export class HeaderPublic {
  auth = inject(AuthService);
}
