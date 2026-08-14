import {
  Droplet, Filter, Wrench, Package, Building2, Refrigerator, Tag, Star,
  Snowflake, Coffee, Waves, ShieldCheck,
  // إضافات نظام الثقة والمميزات
  BadgeCheck, Lock, Truck, RotateCcw, Wallet, Headset, Home, Factory,
  Sparkles, Timer, Award, Users, ThermometerSun, FlaskConical, Recycle, Gauge, AlertOctagon, Zap, Droplets, Percent, Flame,
} from "lucide-react";

export const ICON_MAP = {
  Droplet, Filter, Wrench, Package, Building2, Refrigerator, Tag, Star,
  Snowflake, Coffee, Waves, ShieldCheck,
  BadgeCheck, Lock, Truck, RotateCcw, Wallet, Headset, Home, Factory,
  Sparkles, Timer, Award, Users, ThermometerSun, FlaskConical, Recycle, Gauge, AlertOctagon, Zap, Droplets, Percent, Flame,
};

// قائمة الأيقونات المتاحة لاختيارها من لوحة التحكم
export const ICON_NAMES = Object.keys(ICON_MAP);

export function getIcon(name) {
  return ICON_MAP[name] || Package;
}
