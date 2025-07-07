// Lottery Proof Submission
const LOTTERY_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxp0ARo6khROOxQXm4JDRPdyZr02-5o_jwTs39ZbKWmLkmFiCy9-0b9DMe9059KNJDB/exec';
const LOTTERY_API_KEY = 'yY7$9kL2#pQ5&vR8!sT3*uW6(zX4';
const IMGBB_API_KEY = '5224ba8170fc410f59e73bf3316e84ea';

// Function to upload image to ImgBB
async function uploadLotteryImage(file) {
  if (!file) return null;
  
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    return result.data?.url || null;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

// Function to submit lottery proof using JSONP
function submitWithJsonp(url, data) {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    const script = document.createElement('script');
    
    window[callbackName] = function(response) {
      delete window[callbackName];
      document.body.removeChild(script);
      resolve(response);
    };

    const params = new URLSearchParams();
    params.append('callback', callbackName);
    for (const key in data) {
      params.append(key, data[key]);
    }

    script.src = url + '?' + params.toString();
    document.body.appendChild(script);

    // Handle errors
    script.onerror = () => {
      delete window[callbackName];
      document.body.removeChild(script);
      reject(new Error('Request failed'));
    };
  });
}

// Function to submit lottery proof
async function submitLotteryProof(username, image1, image2) {
  if (!username) {
    showLotteryMessage('请输入游戏昵称', 'error');
    return false;
  }

  showLotteryMessage('正在提交中，请稍候...', 'info');

  try {
    // Upload images in parallel
    const [image1Url, image2Url] = await Promise.all([
      uploadLotteryImage(image1),
      uploadLotteryImage(image2)
    ]);

    if ((image1 && !image1Url) || (image2 && !image2Url)) {
      throw new Error('图片上传失败，请重试');
    }

    // Prepare request data
    const requestData = {
      action: 'add_lottery_proof',
      api_key: LOTTERY_API_KEY,
      username: username,
      image1_url: image1Url || '',
      image2_url: image2Url || '',
      timestamp: new Date().toISOString()
    };

    console.log('Submitting data:', requestData);
    
    // Use JSONP for the request
    const result = await submitWithJsonp(LOTTERY_SCRIPT_URL, requestData);
    
    if (result.status === 'success') {
      showLotteryMessage('提交成功！', 'success');
      document.getElementById('lotteryForm').reset();
      return true;
    } else {
      throw new Error(result.message || '提交失败，请重试');
    }
  } catch (error) {
    console.error('提交错误:', error);
    showLotteryMessage('错误: ' + (error.message || '提交失败，请稍后重试'), 'error');
    return false;
  }
}

// Function to show messages
function showLotteryMessage(message, type = 'info') {
  const messageDiv = document.getElementById('lottery-message');
  if (!messageDiv) return;
  
  messageDiv.textContent = message;
  messageDiv.className = `lottery-message ${type}`;
  messageDiv.style.display = 'block';
  
  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }
}

// Form submission handler
document.getElementById('lotteryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('lottery-username')?.value.trim();
  const image1 = document.getElementById('lottery-image1')?.files[0] || null;
  const image2 = document.getElementById('lottery-image2')?.files[0] || null;
  
  await submitLotteryProof(username, image1, image2);
});