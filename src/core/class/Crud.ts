import { Statusrequest } from './Statusrequest';

// We implement an Either type to mimic the 'dartz' Either used in Dart
export type Either<L, R> = 
  | { _tag: 'Left'; left: L }
  | { _tag: 'Right'; right: R };

export const Left = <L, R = never>(left: L): Either<L, R> => ({ _tag: 'Left', left });
export const Right = <R, L = never>(right: R): Either<L, R> => ({ _tag: 'Right', right });

export const checkInternet = async (): Promise<boolean> => {
    // In browser, we check the navigator online status
    return navigator.onLine;
};

export class Crud {
    async postDataheaders(linkurl: string, data: Record<string, any>): Promise<Either<Statusrequest, any>> {
        try {
            if (await checkInternet()) {
                const token = localStorage.getItem("token");
                const headers: HeadersInit = {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                };
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`;
                }

                const requestBody = JSON.stringify(data);
                console.log(`[postDataheaders] Sending to ${linkurl}:`, requestBody);
                
                const response = await fetch(linkurl, {
                    method: 'POST',
                    headers,
                    body: requestBody
                });

          
                console.log(`[postDataheaders] Status:`, response.status);
                if (response.status === 200 || response.status === 201) {
                    const responsebody = await response.json();
                    return Right(responsebody);
                } else {
                    const responsebody = await response.json().catch(() => null);
                    console.error(`[postDataheaders] API Error Response from ${linkurl}:`, responsebody);
                    return Left(Statusrequest.failure);
                }
            } else {
                return Left(Statusrequest.serverfailure);
            }
        } catch (e) {
            console.error(`[postDataheaders] Exception caught from ${linkurl}:`, e);
            return Left(Statusrequest.failure);
        }
    }

    async postDataheadersLogout(linkurl: string): Promise<Either<Statusrequest, any>> {
        try {
            if (await checkInternet()) {
                const token = localStorage.getItem("token");
                const headers: HeadersInit = {
                    "Accept": "application/json",
                };
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`;
                }

                const response = await fetch(linkurl, {
                    method: 'POST',
                    headers
                });

                console.log(response.status);
                if (response.status === 200 || response.status === 201) {
                    const responsebody = await response.json();
                    console.log(responsebody);
                    return Right(responsebody);
                } else {
                    const responsebody = await response.json().catch(() => null);
                    console.error(`[postDataheadersLogout] API Error Response from ${linkurl}:`, responsebody);
                    return Left(Statusrequest.failure);
                }
            } else {
                return Left(Statusrequest.serverfailure);
            }
        } catch (e) {
            console.error(`[postDataheadersLogout] Exception caught from ${linkurl}:`, e);
            return Left(Statusrequest.failure);
        }
    }

    async postData(linkurl: string, data: Record<string, any>): Promise<Either<Statusrequest, any>> {
        try {
            if (await checkInternet()) {
                // Mimicking URL-encoded form data which is the default for simple post body in Dart http
                const formData = new URLSearchParams();
                for (const key in data) {
                    const value = data[key];
                    if (value !== null && value !== undefined) {
                        formData.append(key, value);
                    }
                }

                const response = await fetch(linkurl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData.toString()
                });

                console.log(response.status);
                if (response.status === 200 || response.status === 201) {
                    const responsebody = await response.json();
                    console.log(responsebody);
                    return Right(responsebody);
                } else {
                    const responsebody = await response.json().catch(() => null);
                    console.error(`[postData] ❌ API Error Response from ${linkurl}:`, responsebody);
                    return Left(Statusrequest.failure);
                }
            } else {
                return Left(Statusrequest.serverfailure);
            }
        } catch (e) {
            console.error(`[postData] ❌ Exception caught from ${linkurl}:`, e);
            return Left(Statusrequest.failure);
        }
    }

    async getData(linkurl: string): Promise<Either<Statusrequest, any>> {
        try {
            if (await checkInternet()) {
                const token = localStorage.getItem("token");
                const headers: HeadersInit = {
                    "Accept": "application/json",
                };
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`;
                }

                const response = await fetch(linkurl, {
                    method: 'GET',
                    headers
                });

                console.log(response.status);
                if (response.status === 200 || response.status === 201) {
                    const responsebody = await response.json();
                    return Right(responsebody);
                } else {
                    const responsebody = await response.json().catch(() => null);
                    console.error(`[getData] API Error Response from ${linkurl}:`, responsebody);
                    return Left(Statusrequest.failure);
                }
            } else {
                return Left(Statusrequest.serverfailure);
            }
        } catch (e) {
            console.error(`[getData] Exception caught from ${linkurl}:`, e);
            return Left(Statusrequest.failure);
        }
    }

    async addRequestWithImageOne(url: string, data: Record<string, any>, image: File | null, namerequest: string = "image"): Promise<Either<Statusrequest, any>> {
        try {
            if (await checkInternet()) {
                const token = localStorage.getItem("token");
                const headers: HeadersInit = {
                    "Accept": "application/json",
                };
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`;
                }

                const formData = new FormData();
                if (image) {
                    formData.append(namerequest, image);
                }
                
                Object.keys(data).forEach(key => {
                    const value = data[key];
                    if (value !== null && value !== undefined) {
                        formData.append(key, String(value));
                    }
                });

                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: formData
                });

                if (response.status === 200 || response.status === 201) {
                    const responsebody = await response.json();
                    console.log(`[addRequestWithImageOne] Success from ${url}:`, responsebody);
                    return Right(responsebody);
                } else {
                    const text = await response.text();
                    console.error(`[addRequestWithImageOne] Server failure from ${url}: ${response.status} - ${text}`);
                    return Left(Statusrequest.failure);
                }
            } else {
                return Left(Statusrequest.serverfailure);
            }
        } catch (e) {
            console.error(`[addRequestWithImageOne] Exception caught from ${url}:`, e);
            return Left(Statusrequest.failure);
        }
    }
}
