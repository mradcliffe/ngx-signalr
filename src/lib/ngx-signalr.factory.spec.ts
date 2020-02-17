import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';
import { skipWhile } from 'rxjs/operators';

import { defaultNgxSignalrOptions, NgxSignalrFactory } from './ngx-signalr.factory';
import { SignalrHttpClientWrapper } from './signalr-http-client.wrapper';


describe('NgxSignalrFactory', () => {
  let builder: jasmine.SpyObj<HubConnectionBuilder>;
  let hubConnection: jasmine.SpyObj<HubConnection>;
  let service: NgxSignalrFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NgxSignalrFactory, SignalrHttpClientWrapper],
    });
    service = TestBed.inject(NgxSignalrFactory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createHubConnection()', () => {
    beforeEach(() => {
      builder = jasmine.createSpyObj('HubConnectionBuilder', [
        'withAutomaticReconnect',
        'withUrl',
        'withHubProtocol',
        'build',
      ]);
      hubConnection = jasmine.createSpyObj('HubConnection', [
        'start',
        'stop',
        'onclose',
        'onreconnected',
        'onreconnecting',
      ]);
      hubConnection.start.and.callFake(() => Promise.resolve());
      builder.build.and.returnValue(hubConnection);
      builder.withHubProtocol.and.callFake(() => builder);
      builder.withUrl.and.callFake(() => builder);
    });

    it('should return a wrapped hub connection', (done) => {
      const options = Object.assign(defaultNgxSignalrOptions, { builder });
      service.createHubConnection('https://example.com/hub/test', options)
        .pipe(
          skipWhile(connection => connection === null),
        )
        .subscribe((connection) => {
          expect(connection).toBeDefined();
          done();
        }, (err) => {
          expect(err).not.toBeDefined();
          done();
        });
    });

    it('should handle when signalr@3.1', (done) => {
      builder.withAutomaticReconnect = undefined;
      const options = Object.assign(defaultNgxSignalrOptions, { builder });
      service.createHubConnection('https://example.com/hub/test', options)
        .pipe(
          skipWhile(connection => connection === null),
        )
        .subscribe((connection) => {
          expect(connection).toBeDefined();
          done();
        }, (err) => {
          expect(err).not.toBeDefined();
          done();
        });
    });

    it('should handle an error during connection', (done) => {
      const options = Object.assign(defaultNgxSignalrOptions, { builder });
      hubConnection.start.and.returnValue(Promise.reject(new Error('Error')));

      service.createHubConnection('https://example.com/hub/test', options)
        .subscribe((connection) => {
          expect(connection).toBeNull();
          done();
        }, (err: Error) => {
          expect(err.message).toEqual('Error');
          done();
        });
    });
  });
});
