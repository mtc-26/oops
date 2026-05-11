import { Component, input } from '@angular/core';

@Component({
  selector: 'app-oops-logo',
  template: `<span class="oops-logo" [class.orange]="orange()">OOPS!</span>`,
  styles: [
    `
      .oops-logo {
        font-family: var(--font-display);
        font-weight: 900;
        font-size: var(--logo-size, 1.5rem);
        letter-spacing: -1px;
        color: #ffffff;
        line-height: 1;
        display: inline-block;
      }
      .oops-logo.orange {
        color: var(--color-orange);
        font-size: var(--logo-size, 3rem);
      }
    `,
  ],
})
export class OopsLogo {
  orange = input(false);
}
