import { NgModule } from '@angular/core';
import { SignalrFactory } from './signalr.factory';
import { SignalrHttpClientWrapper } from './signalr-http-client.wrapper';

@NgModule({
  declarations: [],
  providers: [SignalrFactory, SignalrHttpClientWrapper],
  imports: [],
  exports: [],
})
export class SignalrModule {}
