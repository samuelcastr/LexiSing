import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitoreoConversaciones } from './monitoreo-conversaciones';

describe('MonitoreoConversaciones', () => {
  let component: MonitoreoConversaciones;
  let fixture: ComponentFixture<MonitoreoConversaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitoreoConversaciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonitoreoConversaciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
