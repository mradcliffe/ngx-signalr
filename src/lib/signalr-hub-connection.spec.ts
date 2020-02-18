import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HubConnection, Subject as SignalrSubject } from '@microsoft/signalr';
import { map, skipWhile } from 'rxjs/operators';

import { SignalrHubConnection } from './signalr-hub-connection';
import { HttpClientWrapper } from './http-client.wrapper';

describe('SignalrHubConnection', () => {
  let hubConnection: jasmine.SpyObj<HubConnection>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpClientWrapper],
    });

    hubConnection = jasmine.createSpyObj('HubConnection', [
      'on',
      'off',
      'stream',
      'send',
      'invoke',
      'onclose',
      'start',
      'stop',
    ]);

    hubConnection.start.and.callFake(() => Promise.resolve(null));

    // Mock read-only connectionId property.
    (hubConnection as any).connectionId = '1';
  });

  it('should create a wrapped connection and start it', () => {
    (hubConnection as any).connectionId = null;
    const connection = new SignalrHubConnection(hubConnection);
    expect(hubConnection.start).toHaveBeenCalled();
    expect(connection).toBeDefined();
  });

  it('should create a wrapped connection', () => {
    const connection = new SignalrHubConnection(hubConnection);
    expect(connection).toBeDefined();
    expect(connection.getConnection()).toBeDefined();
  });

  describe('stop()', () => {
    it('should stop the connection', (done) => {
      hubConnection.stop.and.callFake(() => Promise.resolve());
      const connection = new SignalrHubConnection(hubConnection);
      connection.stop()
        .subscribe((success) => {
          expect(success).toBe(true);
          done();
        }, (err) => {
          expect(err).not.toBeDefined();
          done();
        });
    });

    it('should catch the error and return false when failing to stop the connection', (done) => {
      hubConnection.stop.and.callFake(() => Promise.reject('Error'));
      const connection = new SignalrHubConnection(hubConnection);
      connection.stop()
        .subscribe((success) => {
          expect(success).toBe(false);
          done();
        }, (err) => {
          expect(err).not.toBeDefined();
          done();
        });
    });
  });

  describe('on()', () => {
    it('should register a handler for a method', (done) => {
      let spy: jasmine.Spy;
      const returnValue = 5;
      const methods: {[key: string]: Function} = {};
      hubConnection.on.and.callFake((methodName: string, callback: Function) => {
        methods[methodName] = callback;
        spy = spyOn(methods, methodName);
      });

      const connection = new SignalrHubConnection(hubConnection);

      connection.on<number>('test')
        .pipe(
          map(() => {
            methods['test'](returnValue);
            return null;
          }),
        )
        .subscribe(() => {
          expect(spy).toHaveBeenCalledWith(returnValue);
          done();
        }, (err) => {
          expect(err).not.toBeDefined();
          done();
        });
    });
  });

  describe('off()', () => {
    it('should unregister a handler for a method', () => {
      let spy: jasmine.Spy;
      hubConnection.on.and.callFake(() => {});
      hubConnection.off.and.callFake(() => {});

      const connection = new SignalrHubConnection(hubConnection);
      const subject = connection.on('test');
      spy = spyOn(subject, 'complete');

      connection.off('test', subject);
      expect(spy).toHaveBeenCalled();
      expect(hubConnection.off).toHaveBeenCalledWith('test', subject.next);
    });

    it('should unregister all handlers when called with only the method name', () => {
      hubConnection.on.and.callFake(() => {});
      hubConnection.off.and.callFake(() => {});

      const connection = new SignalrHubConnection(hubConnection);
      connection.on('test');

      connection.off('test');
      expect(hubConnection.off).toHaveBeenCalledWith('test');
    });
  });

  describe('invoke()', () => {
    it('should subscribe directly to a method on the connection', (done) => {
      const returnValue = 5;
      hubConnection.invoke.and.returnValue(Promise.resolve(returnValue));

      const connection = new SignalrHubConnection(hubConnection);

      connection.invoke<number>('test')
        .subscribe((value) => {
          expect(value).toEqual(returnValue);
          done();
        }, (err) => {
          expect(err).not.toBeDefined();
          done();
        });
    });
  });

  describe('send()', () => {
    it('should return true when successful', (done) => {
      hubConnection.send.and.returnValue(Promise.resolve());
      const connection = new SignalrHubConnection(hubConnection);

      connection.send('test')
        .subscribe((success) => {
          expect(success).toBe(true);
          done();
        }, (err) => {
          expect(err).not.toBeDefined();
          done();
        });
    });

    it('should return false when not successful', (done) => {
      hubConnection.send.and.returnValue(Promise.reject());
      const connection = new SignalrHubConnection(hubConnection);

      connection.send('test')
        .subscribe((success) => {
          expect(success).toBe(false);
          done();
        }, (err) => {
          expect(err).not.toBeDefined();
          done();
        });
    });
  });

  describe('stream()', () => {
    it('should return values until the stream is finished', (done) => {
      const max = 5;
      const subject = new SignalrSubject<number>();
      hubConnection.stream.and.returnValue(subject);

      const connection = new SignalrHubConnection(hubConnection);
      connection.stream<number>('test')
        .pipe(
          skipWhile(value => value !== (max - 1)),
        )
        .subscribe((value) => {
          expect(value).toEqual(max - 1);
          done();
        }, (err) => {
          expect(err).not.toBeDefined();
          done();
        });

      for (let i = 0; i < max; i++) {
        subject.next(i);
        if (i === max - 1) {
          subject.complete();
        }
      }
    });
  });
});
