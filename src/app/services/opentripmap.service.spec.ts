import { TestBed } from '@angular/core/testing';

import { OpentripmapService } from './opentripmap.service';

describe('OpentripmapService', () => {
  let service: OpentripmapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpentripmapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
