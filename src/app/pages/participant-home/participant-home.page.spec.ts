import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParticipantHomePage } from './participant-home.page';

describe('ParticipantHomePage', () => {
  let component: ParticipantHomePage;
  let fixture: ComponentFixture<ParticipantHomePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
