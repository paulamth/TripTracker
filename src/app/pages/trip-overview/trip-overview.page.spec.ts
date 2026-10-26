import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripOverviewPage } from './trip-overview.page';

describe('TripOverviewPage', () => {
  let component: TripOverviewPage;
  let fixture: ComponentFixture<TripOverviewPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TripOverviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
