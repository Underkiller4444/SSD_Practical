const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Try to find Chrome on Windows
let chromePath = process.env.CHROME_BIN;
if (!chromePath) {
    chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}

(async function runTest() {
    let options = new chrome.Options();
    options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu');
    
    // Only set Chrome binary path if it's not the default
    if (process.env.CHROME_BIN) {
        options.setChromeBinaryPath(chromePath);
    }

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log('Starting UI tests...');
        
        // Test 1: Check search page loads correctly
        console.log('Test 1: Loading search page...');
        await driver.get('http://localhost:8080/');
        let title = await driver.getTitle();
        if (!title.includes('Search')) throw new Error('Search page not loaded');
        console.log('✓ Search page loaded successfully');

        // Test 2: Test XSS attack with script tag
        console.log('Test 2: Testing XSS attack (script tag)...');
        let searchInput = await driver.findElement(By.name('searchTerm'));
        let submitButton = await driver.findElement(By.css('button[type="submit"]'));
        
        await searchInput.clear();
        await searchInput.sendKeys('<script>alert("XSS")</script>');
        await submitButton.click();
        
        // Should redirect back to search page
        await driver.wait(until.titleContains('Search'), 5000);
        let currentTitle = await driver.getTitle();
        if (!currentTitle.includes('Search')) throw new Error('Should have redirected back to search page');
        console.log('✓ XSS attack (script tag) correctly blocked');

        // Test 3: Test XSS attack with event handler
        console.log('Test 3: Testing XSS attack (event handler)...');
        // Wait for page to be ready and find fresh elements after page reload
        await driver.wait(until.elementLocated(By.name('searchTerm')), 5000);
        searchInput = await driver.findElement(By.name('searchTerm'));
        submitButton = await driver.findElement(By.css('button[type="submit"]'));
        
        await searchInput.clear();
        await searchInput.sendKeys('<img src=x onerror=alert(1)>');
        await submitButton.click();
        
        // Should redirect back to search page
        await driver.wait(until.titleContains('Search'), 5000);
        currentTitle = await driver.getTitle();
        if (!currentTitle.includes('Search')) throw new Error('Should have redirected back to search page');
        console.log('✓ XSS attack (event handler) correctly blocked');

        // Test 4: Test XSS attack with javascript protocol
        console.log('Test 4: Testing XSS attack (javascript protocol)...');
        // Wait for page to be ready and find fresh elements after page reload
        await driver.wait(until.elementLocated(By.name('searchTerm')), 5000);
        searchInput = await driver.findElement(By.name('searchTerm'));
        submitButton = await driver.findElement(By.css('button[type="submit"]'));
        
        await searchInput.clear();
        // Using a safe test string that contains 'javascript:' pattern without actual protocol
        await searchInput.sendKeys('search for javascript: protocol detection test');
        await submitButton.click();
        
        // Should redirect back to search page
        await driver.wait(until.titleContains('Search'), 5000);
        currentTitle = await driver.getTitle();
        if (!currentTitle.includes('Search')) throw new Error('Should have redirected back to search page');
        console.log('✓ XSS attack (javascript protocol) correctly blocked');

        // Test 5: Test valid search term that leads to results page
        console.log('Test 5: Testing valid search term...');
        // Wait for page to be ready and find fresh elements after page reload
        await driver.wait(until.elementLocated(By.name('searchTerm')), 5000);
        searchInput = await driver.findElement(By.name('searchTerm'));
        submitButton = await driver.findElement(By.css('button[type="submit"]'));

        await searchInput.clear();
        await searchInput.sendKeys('Machine Learning Tutorial');
        await submitButton.click();

        // Wait for the results page to appear
        await driver.wait(until.elementLocated(By.css('h1')), 5000);
        let h1 = await driver.findElement(By.css('h1'));
        let h1Text = await h1.getText();
        if (!h1Text.includes('Welcome')) throw new Error('Did not reach results page');
        console.log('✓ Valid search term accepted - reached results page');

        // Check that the search term is displayed safely
        let pageSource = await driver.getPageSource();
        if (!pageSource.includes('Machine Learning Tutorial')) throw new Error('Search term not displayed on results page');
        console.log('✓ Search term correctly displayed on results page');

        // Test 6: Test return to home functionality
        console.log('Test 6: Testing return to home...');
        // Find fresh return button element on the results page
        let returnButton = await driver.findElement(By.css('button[type="submit"]'));
        await returnButton.click();

        // Wait for the search page to reload
        await driver.wait(until.titleContains('Search'), 5000);
        let newTitle = await driver.getTitle();
        if (!newTitle.includes('Search')) throw new Error('Did not return to search page');
        console.log('✓ Return to home successful - returned to search page');

        console.log('\n🎉 All UI tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    } finally {
        await driver.quit();
    }
})();