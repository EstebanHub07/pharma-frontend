import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';
import { permisoGuard } from './permiso-guard';

describe('permisoGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => permisoGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
