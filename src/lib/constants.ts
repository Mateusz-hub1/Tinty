export interface BrandSpec {
    packagePrice: number;
    packageGrams: number;
}

export const BRAND_SPECS: Record<string, BrandSpec> = {
    "L'Oréal": { packagePrice: 45, packageGrams: 60 },
    Wella: { packagePrice: 42, packageGrams: 60 },
    Schwarzkopf: { packagePrice: 39, packageGrams: 60 },
    Matrix: { packagePrice: 45, packageGrams: 90 },
    Fanola: { packagePrice: 35, packageGrams: 100 },
};

// Ujednolicona cena oksydantu: 30 zł za 1000 ml (0,03 zł/g)
export const DEVELOPER_CONFIG = {
    pricePerBottle: 30,
    gramsPerBottle: 1000,
    pricePerGram: 30 / 1000, // 0.03 zł / g
};