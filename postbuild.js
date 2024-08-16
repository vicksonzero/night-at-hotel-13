import { unlinkSync, createWriteStream, writeFileSync, createReadStream } from 'fs'
import archiver from 'archiver'

unlinkSync('./dist/main.js')
unlinkSync('./dist/main.css')

let output = createWriteStream('./dist/night-at-hotel-13.zip')
let archive = archiver('zip', {
  zlib: { level: 9 } // set compression to best
})

const MAX = 13 * 1024 // 13kb

output.on('close', function () {
  const bytes = archive.pointer()
  const percent = (bytes / MAX * 100).toFixed(2)
  const left = MAX - bytes;
  const msg = (bytes > MAX)
    ? (`Size overflow: ${bytes} bytes (${percent}%)\n` +
      `               ${('' + (-left)).padStart(5, ' ')} bytes over.`)
    : (bytes / MAX > 0.8)
      ? (`Size: ${('' + bytes).padStart(5, ' ')} bytes (${percent}%)` +
        `      ${('' + left).padStart(5, ' ')} bytes left.`)
      : (`Size: ${bytes} bytes (${percent}%)`)
    ;
  if (bytes > MAX) {
    console.error(msg)
  } else {
    console.log(msg)
  }

  writeFileSync('buildSize.txt', msg);
})

archive.on('warning', function (err) {
  if (err.code === 'ENOENT') {
    console.warn(err)
  } else {
    throw err
  }
})

archive.on('error', function (err) {
  throw err
})

archive.pipe(output)
archive.append(
  createReadStream('./dist/index.html'), {
  name: 'index.html'
}
)

archive.finalize()
