import { TestBed } from '@angular/core/testing';

import { GeoapifyService } from './geoapify.service';

describe('GeoapifyService', () => {
  let service: GeoapifyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoapifyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
