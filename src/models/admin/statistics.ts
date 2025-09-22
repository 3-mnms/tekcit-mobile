export interface BookingStatsResponse {
    success: boolean;
    data: {
        performanceDate: string;
        bookingCount: number;
        availableNOP: number;
    }[];
    message: string;
}

export interface EntranceStatsResponse {
    success: boolean;
    data: {
        festivalId: string;
        performanceDate: string;
        availableNOP: number;
        checkedInCount: number;
    };
    message: string;
}

