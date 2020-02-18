import { NgModule } from '@angular/core';
import { SignalrFactory } from './signalr.factory';
import { HttpClientWrapper } from './http-client.wrapper';

@NgModule({
  declarations: [],
  providers: [SignalrFactory, HttpClientWrapper],
  imports: [],
  exports: [],
})
export class SignalrModule {}
