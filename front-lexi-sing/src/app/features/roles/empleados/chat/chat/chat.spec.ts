import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatEmpleados } from './chat';

describe('ChatEmpleados', () => {
  let component: ChatEmpleados;
  let fixture: ComponentFixture<ChatEmpleados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatEmpleados]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatEmpleados);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
