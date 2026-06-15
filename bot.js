const mineflayer = require("mineflayer")
const readline = require("readline")
const config = require('./config.json')
const fs = require('fs')
const http = require('http')

http.createServer((req, res) => res.end('Bot running!')).listen(process.env.PORT || 3000)

let bot_args = {
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version,
    respawn: config.respawn
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

let reconnecting = false
let afkInterval = null
let wAfkInterval = null

function start_bot() {
    const bot = mineflayer.createBot(bot_args)

    let spawnCount = 0      // đếm lần spawn: 1 = lobby, 2+ = sub-server
    let joiningServer = false  // chỉ click window khi đang trong quá trình vào server

    bot.on('login', () => {
        console.log('Logged in')
        spawnCount = 0

        if (config.registered == false) {
            setTimeout(() => {
                bot.chat(`/dk ${config.botPassword}`)
                config.registered = true
                console.log('[+] Đã Đăng Ký')
                fs.writeFileSync('./config.json', JSON.stringify(config, null, 4))
            }, 2000)
        } else {
            setTimeout(() => {
                bot.chat(`/dn ${config.botPassword}`)
                console.log('[+] Đã Gửi Lệnh Đăng Nhập')
            }, 2000)
        }
    })

    bot.on('death', () => {
        console.log('Bot đã chết')
        let delay = Math.floor(Math.random() * 10000)
        console.log(`Respawn sau ${delay}ms...`)
        setTimeout(() => bot.respawn(), delay)
    })

    bot.on('spawn', () => {
    spawnCount++
    console.log(`[+] Spawn lần ${spawnCount}`)

    if (spawnCount === 1) {
        setTimeout(() => {
            bot.setQuickBarSlot(4)
            console.log('[+] Đã chọn ô số 5')

            // Thử mở menu, retry nếu không có window
            let attempts = 0
            let windowOpened = false

            function tryOpenMenu() {
                if (windowOpened) return
                if (attempts >= 5) {
                    console.log('[!] Không mở được menu sau 5 lần thử')
                    return
                }

                attempts++
                joiningServer = true
                bot.activateItem()
                console.log(`[+] Chuột phải lần ${attempts}...`)

                // Nếu sau 3s vẫn chưa có window → thử lại
                setTimeout(() => {
                    if (!windowOpened) {
                        console.log('[!] Chưa thấy menu, thử lại...')
                        tryOpenMenu()
                    }
                }, 3000)
            }

            // Đánh dấu khi window mở thành công
            bot.once('windowOpen', () => {
                windowOpened = true
            })

            setTimeout(tryOpenMenu, 500)

        }, 3500)
    } else {
        console.log('[+] Đã vào sub-server!')
    }
})

    bot.on('chat', (username, message) => {
        // để trống hoặc thêm handler nếu cần
    })

    bot.on('messagestr', (messagePosition, message) => {
        console.log(`[${message}] ${messagePosition}`)
    })

    rl.removeAllListeners('line')
    rl.on('line', (line) => {
        if (line == 'menu') {
            bot.chat('/menu')
        } else if (line.includes('tpa')) {
            bot.chat(`/tpa ${config.ownerUsername}`)
        } else if (line == 'afk') {
            clearInterval(afkInterval)
            afkInterval = setInterval(() => {
                bot.setControlState('jump', true)
                setTimeout(() => bot.setControlState('jump', false), 200)
            }, 5000)
        } else if (line == 'wafk') {
            clearInterval(wAfkInterval)
            let yaw = 0
            wAfkInterval = setInterval(() => {
                yaw += 0.5
                bot.look(yaw, -Math.PI / 2, true)
            }, 500)
        } else if (line == 'stop') {
            clearInterval(wAfkInterval)
            clearInterval(afkInterval)
        } else if (line == 'exit') {
            reconnecting = false
            bot.quit()
        }
    })

    bot.on('windowOpen', (window) => {
        // Bỏ qua nếu không phải đang trong quá trình vào server
        if (!joiningServer) return

        console.log(`[+] Cửa sổ mở: ${window.title}`)

        // In ra slot để debug (tắt đi sau khi tìm được slot đúng)
        window.slots.forEach((slot, index) => {
            if (slot) console.log(`  Slot ${index}: ${slot.name} x${slot.count}`)
        })

        setTimeout(() => {
            bot.clickWindow(24, 0, 0)  // ← đổi số này nếu cần
            console.log('[+] Đã bấm vào menu')
            joiningServer = false
        }, 1000)
    })

    bot.on('end', () => {
        if (reconnecting) return
        reconnecting = true
        console.log('Mất kết nối, reconnect sau 5s...')

        setTimeout(() => {
            reconnecting = false
            start_bot()
        }, 5000)
    })
}

start_bot()
