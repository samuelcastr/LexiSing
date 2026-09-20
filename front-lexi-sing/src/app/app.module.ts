import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatGridListModule } from '@angular/material/grid-list';
import { routes } from './app.routes';
import { AppComponent } from './app.component';
import { AuthGuard } from './core/guards/auth.guard';
import { FirebaseTokenInterceptor } from './core/interceptors/firebase-token.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, MatToolbarModule, MatButtonModule, MatCardModule, MatInputModule, MatIconModule, MatListModule, MatDialogModule, MatChipsModule, MatSnackBarModule, MatProgressBarModule, MatSidenavModule, MatMenuModule, MatGridListModule],
  providers: [AuthGuard, FirebaseTokenInterceptor],
  bootstrap: [AppComponent]
})
export class AppModule {}
