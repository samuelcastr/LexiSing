import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversacionList } from './conversacion-list';

describe('ConversacionList', () => {
  let component: ConversacionList;
  let fixture: ComponentFixture<ConversacionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversacionList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConversacionList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
