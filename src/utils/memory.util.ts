import v8 from 'v8'

export const getMemoryStats = (): any => {

    const mem = v8.getHeapStatistics();
    return mem ? mem : null;

}

export const getHeapSize = (unit: string): any => {

    let heapSize: any;

    const total = v8.getHeapStatistics().total_available_size;

    if(unit === 'bytes'){
        heapSize = (total)
    }else if(unit === 'kb' || unit === 'KB' || unit === 'kilobytes'){
        heapSize = (total / 1024 ).toFixed(2);
    }else if(unit === 'mb' || unit === 'MB' || unit === 'megabytes'){
        heapSize = (total / 1024 / 1024 ).toFixed(2);
    }else if(unit === 'gb' || unit === 'GB' || unit === 'gigabytes'){
        heapSize = (total / 1024 / 1024 / 1024).toFixed(2);
    }
    
    return heapSize;

}