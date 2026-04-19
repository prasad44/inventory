export type SpecFieldType = "text" | "number" | "boolean";

export interface SpecField {
  key: string;
  label: string;
  type: SpecFieldType;
  /** Optional placeholder / units hint */
  hint?: string;
}

/**
 * Maps a category slug to its ordered list of spec fields.
 * If a category isn't in here, the editor falls back to a free-form
 * key/value row mode so admins can still capture arbitrary fields.
 */
export const SPECS_SCHEMA: Record<string, SpecField[]> = {
  headphones: [
    { key: "driver_mm", label: "Driver size (mm)", type: "number" },
    { key: "freq_hz", label: "Frequency range", type: "text", hint: "e.g. 20-20000" },
    { key: "impedance_ohm", label: "Impedance (Ω)", type: "number" },
    { key: "battery_hours", label: "Battery life (hours)", type: "number" },
    { key: "bluetooth", label: "Bluetooth version", type: "text", hint: "e.g. 5.3" },
    { key: "noise_cancel", label: "Active noise cancelling", type: "boolean" },
    { key: "weight_g", label: "Weight (g)", type: "number" },
  ],
  earbuds: [
    { key: "driver_mm", label: "Driver size (mm)", type: "number" },
    { key: "battery_hours", label: "Battery life per charge (hours)", type: "number" },
    { key: "case_hours", label: "Total with case (hours)", type: "number" },
    { key: "bluetooth", label: "Bluetooth version", type: "text" },
    { key: "noise_cancel", label: "Active noise cancelling", type: "boolean" },
    { key: "ip_rating", label: "IP rating", type: "text", hint: "e.g. IPX4" },
  ],
  "bluetooth-speakers": [
    { key: "power_w", label: "Power output (W)", type: "number" },
    { key: "battery_hours", label: "Battery life (hours)", type: "number" },
    { key: "bluetooth", label: "Bluetooth version", type: "text" },
    { key: "ip_rating", label: "IP rating", type: "text" },
    { key: "weight_g", label: "Weight (g)", type: "number" },
  ],
  soundbars: [
    { key: "power_w", label: "Total power (W)", type: "number" },
    { key: "channels", label: "Channels", type: "text", hint: "e.g. 5.1" },
    { key: "hdmi_in", label: "HDMI inputs", type: "number" },
    { key: "bluetooth", label: "Bluetooth version", type: "text" },
    { key: "subwoofer", label: "Includes subwoofer", type: "boolean" },
  ],
  "led-bulbs": [
    { key: "wattage", label: "Wattage (W)", type: "number" },
    { key: "lumens", label: "Lumens", type: "number" },
    { key: "color_temp_min", label: "Color temp min (K)", type: "number" },
    { key: "color_temp_max", label: "Color temp max (K)", type: "number" },
    { key: "fitting", label: "Fitting", type: "text", hint: "e.g. E27" },
  ],
  "smart-lights": [
    { key: "wattage", label: "Wattage (W)", type: "number" },
    { key: "lumens", label: "Lumens", type: "number" },
    { key: "color_temp_min", label: "Color temp min (K)", type: "number" },
    { key: "color_temp_max", label: "Color temp max (K)", type: "number" },
    { key: "colors", label: "Colors", type: "text", hint: "e.g. 16M" },
    { key: "fitting", label: "Fitting", type: "text" },
    { key: "smart", label: "Smart / Wi-Fi", type: "boolean" },
  ],
  "led-strips": [
    { key: "wattage", label: "Wattage (W)", type: "number" },
    { key: "length_m", label: "Length (m)", type: "number" },
    { key: "colors", label: "Colors", type: "text" },
    { key: "smart", label: "Smart / Wi-Fi", type: "boolean" },
    { key: "ip_rating", label: "IP rating", type: "text" },
  ],
  "solar-garden-lights": [
    { key: "panel_watts", label: "Panel wattage (W)", type: "number" },
    { key: "led_watts", label: "LED wattage (W)", type: "number" },
    { key: "battery_wh", label: "Battery capacity (Wh)", type: "number" },
    { key: "auto_on_off", label: "Auto on/off", type: "boolean" },
    { key: "ip_rating", label: "IP rating", type: "text" },
  ],
  "solar-panels": [
    { key: "panel_watts", label: "Panel wattage (W)", type: "number" },
    { key: "voltage", label: "Voltage (V)", type: "number" },
    { key: "controller", label: "Charge controller included", type: "boolean" },
    { key: "dimensions_cm", label: "Dimensions (cm)", type: "text" },
  ],
  "solar-power-banks": [
    { key: "capacity_mah", label: "Capacity (mAh)", type: "number" },
    { key: "panel_watts", label: "Panel wattage (W)", type: "number" },
    { key: "usb_ports", label: "USB ports", type: "number" },
    { key: "ip_rating", label: "IP rating", type: "text" },
  ],
  "solar-street-lights": [
    { key: "panel_watts", label: "Panel wattage (W)", type: "number" },
    { key: "led_watts", label: "LED wattage (W)", type: "number" },
    { key: "battery_wh", label: "Battery capacity (Wh)", type: "number" },
    { key: "motion_sensor", label: "Motion sensor", type: "boolean" },
    { key: "ip_rating", label: "IP rating", type: "text" },
  ],
  "cables-chargers": [
    { key: "length_m", label: "Length (m)", type: "number" },
    { key: "type", label: "Cable type", type: "text", hint: "e.g. USB-C to Lightning" },
    { key: "power_w", label: "Power delivery (W)", type: "number" },
    { key: "data_gbps", label: "Data rate (Gbps)", type: "number" },
  ],
  "power-banks": [
    { key: "capacity_mah", label: "Capacity (mAh)", type: "number" },
    { key: "output_w", label: "Output (W)", type: "number" },
    { key: "usb_ports", label: "USB ports", type: "number" },
    { key: "pd", label: "USB-C PD", type: "boolean" },
  ],
  "memory-cards": [
    { key: "capacity_gb", label: "Capacity (GB)", type: "number" },
    { key: "class", label: "Class", type: "text", hint: "e.g. A1 UHS-I" },
    { key: "read_mbps", label: "Read speed (MB/s)", type: "number" },
  ],
  "smart-plugs": [
    { key: "max_load_w", label: "Max load (W)", type: "number" },
    { key: "wifi", label: "Wi-Fi", type: "text", hint: "e.g. 2.4GHz" },
    { key: "energy_monitor", label: "Energy monitor", type: "boolean" },
  ],
  "security-cameras": [
    { key: "resolution", label: "Resolution", type: "text", hint: "e.g. 2K" },
    { key: "night_vision", label: "Night vision", type: "boolean" },
    { key: "ai_detection", label: "AI detection", type: "boolean" },
    { key: "two_way_audio", label: "Two-way audio", type: "boolean" },
  ],
};

export function getSpecsSchema(categorySlug: string | null | undefined): SpecField[] {
  if (!categorySlug) return [];
  return SPECS_SCHEMA[categorySlug] ?? [];
}
