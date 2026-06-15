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
