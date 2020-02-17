import { NgModule } from '@angular/core';
import { NgxSignalrFactory } from './ngx-signalr.factory';
import { SignalrHttpClientWrapper } from './signalr-http-client.wrapper';

@NgModule({
  declarations: [],
  providers: [NgxSignalrFactory, SignalrHttpClientWrapper],
  imports: [],
  exports: [NgxSignalrFactory, SignalrHttpClientWrapper],
})
export class NgxSignalrModule {}
