// tslint:disable: no-console
import { HTTP_INTERCEPTORS, HttpErrorResponse, HttpInterceptor } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpResponse } from '@microsoft/signalr';

import { TestInterceptor } from './testing/test-interceptor';

import { SignalrHttpClientWrapper } from './signalr-http-client.wrapper';

describe('SignalrHttpClientWrapper', () => {
  let service: SignalrHttpClientWrapper;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SignalrHttpClientWrapper, { provide: HTTP_INTERCEPTORS, useClass: TestInterceptor, multi: true }],
    });

    service = TestBed.inject(SignalrHttpClientWrapper);
    controller = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be modified by the testing interceptor', (done) => {
    const interceptors: HttpInterceptor[] = TestBed.get(HTTP_INTERCEPTORS);
    const spy = spyOn(interceptors[0], 'intercept').and.callThrough();
    service.get('https://example.com/hub/test')
      .then(() => {
        expect(spy).toHaveBeenCalled();
        done();
      })
      .catch((err: HttpErrorResponse) => {
        expect(err).not.toBeDefined();
        done();
      });

    controller
      .expectOne('https://example.com/hub/test')
      .flush(`{}`);
  });

  it('should extract headers from SignalR HttpRequest', (done) => {
    service.get('https://example.com/hub/test', { headers: { 'Accept-Language': 'ja-JP', 'Cache-Control': 'no-cache' } })
      .then((res) => {
        expect(res).toBeDefined();
        done();
      })
      .catch((err: HttpErrorResponse) => {
        expect(err).not.toBeDefined();
        done();
      });

    controller
      .expectOne('https://example.com/hub/test')
      .flush(`{}`);
  });

  describe('get()', () => {
    it('should resolve with a SignalR HttpResponse when successful', (done) => {
      const expected = '{"foo":"bar"}';
      service.get('https://example.com/hub/test')
        .then((data: HttpResponse) => {
          expect(data.content).toEqual(expected);
          done();
        })
        .catch((err) => {
          console.error(err);
          expect(err).not.toBeDefined();
          done();
        });

      controller
        .expectOne('https://example.com/hub/test')
        .flush(`{"foo":"bar"}`);
    });

    it('should reject with a HttpResponse when not successful', (done) => {
      service.get('https://example.com/hub/test')
        .then((res) => {
          expect(res).not.toBeDefined();
          done();
        })
        .catch((err: HttpErrorResponse) => {
          expect(err.statusText).toEqual('Unauthorized');
          done();
        });

      controller
        .expectOne('https://example.com/hub/test')
        .flush('', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('post()', () => {
    it('should resolve with a Signalr HttpResponse on success', (done) => {
      const expected = 200;
      service.post('https://example.com/hub/test', { content: '{"foo": "bar"}' })
        .then((res: HttpResponse) => {
          expect(res.statusCode).toEqual(expected);
          done();
        })
        .catch((err) => {
          expect(err).not.toBeDefined();
          done();
        });

      controller
        .expectOne('https://example.com/hub/test')
        .flush('{"foo":"bar"}');
    });

    describe('delete()', () =>  {
      it('should resolve with a Signalr HttpResponse on success', (done) => {
        const expected = 200;
        service.delete('https://example.com/hub/test')
          .then((res: HttpResponse) => {
            expect(res.statusCode).toEqual(expected);
            done();
          })
          .catch((err) => {
            expect(err).not.toBeDefined();
            done();
          });

        controller
          .expectOne('https://example.com/hub/test')
          .flush('{"foo":"bar"}');
      });
    });
  });

  describe('send()', () => {
    it('should use a HttpRequest and resolve as a SignalR HttpResponse', (done) => {
      const expected = 200;
      service.send({ method: 'POST', url: 'https://example.com/hub/test', content: '{"foo":"bar"}' })
        .then((res) => {
          expect(res.statusCode).toEqual(expected);
          done();
        })
        .catch((err) => {
          console.error(err);
          expect(err).not.toBeDefined();
          done();
        });

      controller
        .expectOne('https://example.com/hub/test')
        .flush('{"foo":"bar"}');
    });
  });
});
