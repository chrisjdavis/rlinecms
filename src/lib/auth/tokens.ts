import { randomBytes } from 'crypto'

export async function generateToken(length: number = 32): Promise<string> {
  return new Promise((resolve, reject) => {
    randomBytes(length, (err, buffer) => {
      if (err) {
        reject(err)
      } else {
        resolve(buffer.toString('hex'))
      }
    })
  })
} 