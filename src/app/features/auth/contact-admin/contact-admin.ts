import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contact-admin',
  imports: [FormsModule],
  templateUrl: './contact-admin.html',
  styleUrl: './contact-admin.scss',
})
export class ContactAdmin {
  constructor(private router: Router) {}
  submit() { this.router.navigateByUrl('/'); }
}
