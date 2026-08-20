import { showSnackbar } from './Snacpar';

// Helper functions to replace GetUtils
const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
const isPhoneNumber = (val: string) => /^\+?[0-9]{7,15}$/.test(val);
const isNum = (val: string) => !isNaN(Number(val)) && val.trim() !== '';

export function validInput(
  val: string,
  min: number,
  max: number,
  type: string,
  empty: boolean = false
): string | null {
  const isEmpty = !val || val.trim().length === 0;

  if (isEmpty) {
    if (empty) return null;
    return "لا يمكن أن يكون الحقل فارغاً";
  }

  if (val.length < min) {
    return `لا يمكن أن يكون أقل من ${min} حرف`;
  }

  if (val.length > max) {
    return `لا يمكن أن يتجاوز ${max} حرف`;
  }

  if (type === 'email' || type === 'Email') {
    if (!isEmail(val)) {
      return "البريد الإلكتروني غير صالح";
    }
  }

  if (type === 'phone') {
    if (!isPhoneNumber(val)) {
      return "رقم الهاتف غير صالح";
    }
  }

  if (type === 'number') {
    if (!isNum(val)) {
      return "يجب أن يكون رقماً صالحاً";
    }
  }

  if (type === 'integer') {
    if (!Number.isInteger(Number(val))) {
      return "يجب أن يكون عدداً صحيحاً";
    }
  }

  if (type === 'decimal') {
    if (!isNum(val)) {
      return "يجب أن يكون رقماً عشرياً";
    }
  }

  return null;
}

export function validInputsnak(
  val: string,
  min: number,
  max: number,
  type: string
): boolean {
  if (!val || val.trim().length === 0) {
    showSnackbar("Error", "Field cannot be empty", "red");
    return false;
  }

  if (val.length > max) {
    showSnackbar("Error", `Field max length is ${max}`, "red");
    return false;
  }

  if (val.length < min) {
    showSnackbar("Error", `Field min length is ${min}`, "red");
    return false;
  }

  if (type === 'email' && !isEmail(val)) {
    showSnackbar("Error", "Invalid email address", "red");
    return false;
  }

  if (type === 'phone' && !isPhoneNumber(val)) {
    showSnackbar("Error", "Invalid phone number", "red");
    return false;
  }

  return true;
}
