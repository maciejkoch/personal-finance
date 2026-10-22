import { FormGroup } from '@angular/forms';

export function useConditionallyEnable(form: FormGroup) {
  return (condition: boolean, ...targetControlName: string[]) => {
    const targetControls = targetControlName.map((name) => form.get(name));

    targetControls.forEach((targetControl) => {
      const action = condition ? targetControl?.enable : targetControl?.disable;
      action?.call(targetControl, { emitEvent: false });
    });
  };
}
