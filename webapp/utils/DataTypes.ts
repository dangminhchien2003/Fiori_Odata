import String from "sap/ui/model/type/String";
import ValidateException from "sap/ui/model/ValidateException";
import { isCurrency, isFloat, isInt, isMobilePhone, isUUID } from "validator";
import isEmail from "validator/es/lib/isEmail";

export class FieldEmail extends String {
  public constructor(...args: ConstructorParameters<typeof String>) {
    super(...args);
  }

  public override validateValue(value: string): void | Promise<void> {
    void super.validateValue(value);

    if (value !== "") {
      if (
        !isEmail(value, {
          // eslint-disable-next-line camelcase
          allow_utf8_local_part: false,
        })
      ) {
        throw new ValidateException("Invalid email address");
      }
    }
  }
}

export class FieldPhone extends String {
  public constructor(...args: ConstructorParameters<typeof String>) {
    super(...args);
  }
  public override validateValue(value: string): void | Promise<void> {
    void super.validateValue(value);

    if (value !== "") {
      if (
        !isMobilePhone(value, ["vi-VN", "en-US"], {
          strictMode: false,
        })
      ) {
        throw new ValidateException("Invalid phone number");
      }
    }
  }
}

export class FieldCurrency extends String {
  public constructor(...args: ConstructorParameters<typeof String>) {
    super(...args);
  }
  public override validateValue(value: string): void | Promise<void> {
    void super.validateValue(value);

    if (value !== "") {
      if (
        !isCurrency(value, {
          // eslint-disable-next-line camelcase
          symbol_after_digits: true,
        })
      ) {
        throw new ValidateException("Invalid currency");
      }
    }
  }
}

export class FieldId extends String {
  public constructor(...args: ConstructorParameters<typeof String>) {
    super(...args);
  }
  public override validateValue(value: string): void | Promise<void> {
    void super.validateValue(value);

    if (value !== "") {
      if (!isUUID(value, 4)) {
        throw new ValidateException("Invalid UUID");
      }
    }
  }
}

export class FieldPercentage extends String {
  public constructor(...args: ConstructorParameters<typeof String>) {
    super(...args);
  }
  public override validateValue(value: string): void | Promise<void> {
    void super.validateValue(value);

    if (value !== "") {
      if (
        !isFloat(value, {
          min: 0,
          max: 100,
          locale: "en-US",
        })
      ) {
        throw new ValidateException("Percentage must be between 0 and 100");
      }
    }
  }
}

export class FieldQuantity extends String {
  public constructor(...args: ConstructorParameters<typeof String>) {
    super(...args);
  }
  public override validateValue(value: string): void | Promise<void> {
    void super.validateValue(value);

    if (value !== "") {
      if (
        !isInt(value, {
          min: 0,
        })
      ) {
        throw new ValidateException("Invalid quantity, must be integer ≥ 0");
      }
    }
  }
}
