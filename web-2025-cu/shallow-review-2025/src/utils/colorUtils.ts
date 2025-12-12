
export const MAIN_PALETTE = [
  '#03045E', // Deep Blue
  '#2C5A5B', // Teal
  '#E8B243', // Gold
  '#BE6823', // Orange
  '#5F8366', // Green
  '#7E885E', // Sage
  '#8D6E63', // Brown
  '#546E7A', // Blue Grey
];

export const colorUtils = {
  // Lighten a color by percentage
  lighten: (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  },

  desaturate: (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16)
    const R = num >> 16
    const G = num >> 8 & 0x00FF
    const B = num & 0x0000FF
    const gray = R * 0.299 + G * 0.587 + B * 0.114
    const factor = percent / 100
    const newR = Math.round(R * (1 - factor) + gray * factor)
    const newG = Math.round(G * (1 - factor) + gray * factor)
    const newB = Math.round(B * (1 - factor) + gray * factor)
    return '#' + (0x1000000 + newR * 0x10000 + newG * 0x100 + newB).toString(16).slice(1)
  }
};

export const applyPaletteToData = (data: any[]) => {
  let mainColorIndex = 0

  const applyColors = (items: any[], level: number = 0, parentColor?: string) => {
    return items.map((item, index) => {
      let color: string
      
      if (level === 0) {
        color = MAIN_PALETTE[mainColorIndex % MAIN_PALETTE.length]
        mainColorIndex++
      } else if (level === 1 && parentColor) {
        const lightenAmount = 15 + (index * 3) % 15
        color = colorUtils.lighten(parentColor, lightenAmount)
      } else if (level >= 2 && parentColor) {
        const desatAmount = 10 + (index * 2) % 20
        color = colorUtils.desaturate(parentColor, desatAmount)
      } else {
        color = '#666666'
      }

      const newItem = {
        ...item,
        itemStyle: { color },
      }
      
      if (item.children) {
        newItem.children = applyColors(item.children, level + 1, color)
      }
      
      return newItem
    })
  }
  
  return applyColors(data)
}

