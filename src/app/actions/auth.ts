// 靜態 Demo Mode — 無密碼保護，login 一律放行（純前端）。
export async function login(_password: string) {
    return { success: true };
}

export async function logout() {
    return { success: true };
}
