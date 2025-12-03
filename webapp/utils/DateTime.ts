import dayjs, { Dayjs, type OpUnitType } from "dayjs";

// Plugins
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import utc from "dayjs/plugin/utc";

class DateTime {
  constructor() {
    dayjs.extend(utc);
    dayjs.extend(isSameOrAfter);
  }

  // Predicate
  public IsValid(date: any): date is Dayjs {
    if (!date) return false;
    return dayjs(date).isValid();
  }

  public ToDay(): Dayjs {
    return dayjs();
  }

  public IsSameOrAfter(fromDate?: unknown, toDate?: unknown, unit: OpUnitType = "date") {
    if (!this.IsValid(fromDate) || !this.IsValid(toDate)) {
      return false;
    }

    return dayjs(fromDate).isSameOrAfter(toDate, unit);
  }
}

export default new DateTime();
