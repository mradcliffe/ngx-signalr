import { HttpClient, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  HttpClient as SignalrHttpClient,
  HttpRequest as SignalrHttpRequest,
  HttpResponse as SignalrHttpResponse,
} from '@microsoft/signalr';
import { map } from 'rxjs/operators';

@Injectable()
export class SignalrHttpClientWrapper extends SignalrHttpClient {
  constructor(private http: HttpClient) {
    super();
  }

  /**
   * {@inheritdoc}
   */
  send(request: SignalrHttpRequest): Promise<SignalrHttpResponse> {
    const headers = this.getHeaders(request);
    const body = request.content ? request.content : null;
    const r = new HttpRequest(request.method, request.url, body, {
      headers,
      responseType: request.responseType as any,
    });

    return this.http.request(r)
      .pipe(
        map((res: HttpResponse<any>) => new SignalrHttpResponse(res.status, res.statusText, res.body)),
      )
      .toPromise();
  }

  /**
   * {@inheritdoc}
   */
  get(url: string, options?: SignalrHttpRequest): Promise<SignalrHttpResponse> {
    const headers = this.getHeaders(options);
    return this.http.get(url, { observe: 'response', responseType: 'text', headers })
      .pipe(
        map((res: HttpResponse<any>) => new SignalrHttpResponse(res.status, res.statusText, res.body)),
      )
      .toPromise();
  }

  /**
   * {@inheritdoc}
   */
  post(url: string, options?: SignalrHttpRequest): Promise<SignalrHttpResponse> {
    const body = options.content ? options.content : null;
    const headers = this.getHeaders(options);
    return this.http.post(url, body, { observe: 'response', responseType: 'text', headers })
      .pipe(
        map((res: HttpResponse<any>) => new SignalrHttpResponse(res.status, res.statusText, res.body)),
      )
      .toPromise();
  }

  /**
   * {@inheritdoc}
   */
  delete(url: string, options?: SignalrHttpRequest): Promise<SignalrHttpResponse> {
    const headers = this.getHeaders(options);
    return this.http.delete(url, { observe: 'response', responseType: 'text', headers })
      .pipe(
        map((res: HttpResponse<any>) => new SignalrHttpResponse(res.status, res.statusText, res.body)),
      )
      .toPromise();
  }

  private getHeaders(options?: SignalrHttpRequest): HttpHeaders {
    if (options && options.headers) {
      return new HttpHeaders(options.headers);
    }
    return null;
  }
}
