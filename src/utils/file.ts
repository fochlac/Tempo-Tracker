function text (file: File):Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => resolve(event.target.result as string)
        reader.onerror = reject
        reader.readAsText(file)
    })
}

async function json (file: File) {
    const data = await text(file)
    return JSON.parse(data)
}

export const readFile = {
    text,
    json
}
