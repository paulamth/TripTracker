import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailPagePage } from './detail-page.page';

describe('DetailPagePage', () => {
  let component: DetailPagePage;
  let fixture: ComponentFixture<DetailPagePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailPagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
