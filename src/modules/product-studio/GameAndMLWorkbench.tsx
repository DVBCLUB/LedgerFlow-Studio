import React, { useState, useEffect } from 'react';
import { Gamepad2, Cpu, Brain, Network, Sliders, Play, Pause, RotateCcw, Sparkles, Share2, Zap, Workflow, CheckCircle2, ChevronRight, FileCode, GitBranch, Layers, LineChart, Code, ShieldAlert, Coins, Compass, ArrowRight, Database, Rocket } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// --- TS Interfaces ---
interface GameStage {
  id: string;
  title: string;
  phaseCode: string;
  subtitle: string;
  description: string;
  vnAdvisory: string;
  tools: string[];
  durationWeeks: number;
  tasks: string[];
  codeTemplate: string;
  codeLanguage: string;
}

interface MLModelDetail {
  id: string;
  name: string;
  subtitle: string;
  archDescription: string;
  useCase: string;
  mathFormula: string;
  pythonSnippet: string;
}

// --- Hardcoded Datasets ---
const GAME_STAGES: GameStage[] = [
  {
    id: 'stage_gdd',
    phaseCode: 'STAGE 1',
    title: 'Phác Thảo Concept & Biên Soạn GDD',
    subtitle: 'Định hình cốt lõi game & tài liệu thiết kế',
    description: 'Xác định Gameplay Loop cốt lõi (Core Loop), cơ chế điều khiển chạm vuốt trên mobile (Touch Controls), sơ đồ tiến trình của người chơi (Player Progression) và mô hình Monetization doanh thu.',
    vnAdvisory: 'Nên thiết kế hướng Hyper-casual hoặc Casual Puzzle nếu hoạt động solo để giảm tải thời gian vẽ asset đồ họa siêu nặng.',
    tools: ['Figma (UI/UX)', 'Miro (Sơ đồ cơ chế)', 'Notion (GDD Book)', 'Gemini AI (Cân bằng chỉ số game)'],
    durationWeeks: 2,
    tasks: [
      'Ghi chép Core Loop tối đa 3 câu (Ví dụ: Chạy né tránh -> Thu thập xu -> Nâng cấp skin).',
      'Phác thảo Wireframe màn hình chính, màn hình chơi và bảng cài đặt hồi sinh Ads.',
      'Sử dụng AI giả lập bảng Excel tính toán lượng vàng/màn chơi, độ khó lũy thừa tăng tiến.'
    ],
    codeTemplate: `# Mẫu thiết kế Ý tưởng Game (GDD Template - Solo Mode)
- Tên Dự Kiến: Ninja Jump: Coin Collector
- Thể loại: Endless Runner / Hyper-casual
- Core Loop: Nhấn nhảy tránh bẫy gai -> Ăn xu bạc/vàng -> Mở khóa bùa bổ trợ (Shield, Coin Magnet)
- Kiếm tiền: Quảng cáo xen kẽ (Interstitial) sau mỗi 3 lượt chết + Quảng cáo nhận thưởng (Rewarded Ads) để hồi sinh tại vị trí chết.
- Touch Control: Chạm nửa trái màn hình nhảy ngắn, nửa phải nhảy kép (Double Jump).`,
    codeLanguage: 'markdown'
  },
  {
    id: 'stage_prototype',
    phaseCode: 'STAGE 2',
    title: 'Xây Dựng Prototype & Trải Nghiệm Thử Nghiệm',
    subtitle: 'Lập trình vật lý cơ bản & gameplay thô',
    description: 'Sử dụng các asset miễn phí (placeholder blocks) để kiểm thử mức độ bánh cuốn của Game Feel. Lập trình trọng lực, gia tốc nhảy, va chạm và hệ thống tính điểm ròng rã.',
    vnAdvisory: 'Sử dụng công cụ vật lý mượt mà của Engine 2D/3D. Tránh tự viết vật lý va chạm từ đầu gây ra lỗi xuyên tường giật cục.',
    tools: ['Unity Engine', 'Godot (Cực kỳ nhẹ)', 'Cocos Creator (Web & Mobile HTML5)'],
    durationWeeks: 4,
    tasks: [
      'Lập trình Script di chuyển nhân vật mượt mà, phản hồi lập tức trong dưới 16ms.',
      'Tạo thuật toán sinh màn chơi ngẫu nhiên vô tận (Spawning Pool) tiết kiệm tài nguyên.',
      'Cân chỉnh chỉ số Jump Force và Gravity Scale cho tới khi nhảy cho cảm giác đầm tay nhất.'
    ],
    codeTemplate: `// Unity C# Script - Character Jump Controller (Mobile Optimized)
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public float jumpForce = 12f;
    private Rigidbody2D rb;
    private bool isGrounded;

    void Start() {
        rb = GetComponent<Rigidbody2D>();
    }

    void Update() {
        // Hỗ trợ cả phím Space trên PC và Chạm màn hình đầu tiên trên điện thoại di động
        if ((Input.GetKeyDown(KeyCode.Space) || (Input.touchCount > 0 && Input.GetTouch(0).phase == TouchPhase.Began)) && isGrounded) {
            rb.velocity = new Vector2(rb.velocity.x, jumpForce);
            isGrounded = false;
        }
    }

    private void OnCollisionEnter2D(Collision2D collision) {
        if (collision.gameObject.CompareTag("Ground")) {
            isGrounded = true;
        }
    }
}`,
    codeLanguage: 'csharp'
  },
  {
    id: 'stage_monetization',
    phaseCode: 'STAGE 3',
    title: 'Tích Hợp Game Feel & Hệ Thống Ads',
    subtitle: 'Nội dung gây nghiện & dòng tiền quảng cáo',
    description: 'Áp dụng các hiệu ứng rung điện thoại (Haptic Feedback), hạt nhấp nháy khi ăn xu (Particle Systems) và âm thanh vui tai. Cài đặt SDK AdMob hoặc AppLovin MAX để tải quảng cáo.',
    vnAdvisory: 'Luôn hiển thị tùy chọn xem quảng cáo nhận thưởng một cách tinh tế. Nếu ép sấn xem quảng cáo tự động quá nhiều, 90% người dùng Việt sẽ gỡ cài đặt trong 24 giờ.',
    tools: ['Unity Ady / Google AdMob', 'More Mountains Feel (Asset)', 'Audacity (Cắt sfx miễn phí)'],
    durationWeeks: 3,
    tasks: [
      'Tạo Particle System nổ tóe lửa vàng lung linh khi người chơi thu thập xu vàng.',
      'Đặt bẫy độ rung thích dụng (Haptic Vibration) khi va đập nhẹ hoặc tử trận.',
      'Tích hợp Module SDK hiển thị Rewarded Video nhận x2 điểm thưởng để kéo dài thời lượng chơi.'
    ],
    codeTemplate: `// C# Unity - Google AdMob Rewarded Ad Integration Snippet
using UnityEngine;
using GoogleMobileAds.Api;

public class AdManager : MonoBehaviour
{
    private RewardedAd rewardedAd;
    private string adUnitId = "ca-app-pub-3940256099942544/5224354917"; // Mã Test Ad của Google

    void Start() {
        MobileAds.Initialize(initStatus => { LoadRewardedAd(); });
    }

    public void LoadRewardedAd() {
        RewardedAd.Load(adUnitId, new AdRequest(), (ad, error) => {
            if (error != null) return;
            rewardedAd = ad;
        });
    }

    public void ShowAdAndDoubleCoins() {
        if (rewardedAd != null && rewardedAd.CanShowAd()) {
            rewardedAd.Show(rewardReward => {
                // Thưởng cho người chơi: Nhân đôi lượng vàng tích lũy!
                CurrencyManager.Instance.AddCoins(100);
            });
        }
    }
}`,
    codeLanguage: 'csharp'
  },
  {
    id: 'stage_sdk_compile',
    phaseCode: 'STAGE 4',
    title: 'Gắn SDK & Compile Bản Build Mobile',
    subtitle: 'Liên kết Google Play, App Store & Firebase',
    description: 'Liên kết dự án với Firebase Analytics để đo lường Retention Rate (Tỷ lệ giữ chân người dùng D1, D7, D30). Tạo chứng chỉ Keystore an toàn, cấu hình Gradle để biên dịch bản tệp .AAB (Android App Bundle).',
    vnAdvisory: 'Đảm bảo tuân thủ chuẩn API Android mới nhất của Google Play để tránh bị từ chối duyệt ngay từ bước tải tệp.',
    tools: ['Android Studio / Xcode', 'Java SDK', 'Google Play Console', 'Apple Developer Team'],
    durationWeeks: 3,
    tasks: [
      'Cấu hình Keystore ký số của dự án và lưu giữ mật khẩu bảo mật tuyệt mật.',
      'Xác nhận bộ quyền tối giản nhất trong AndroidManifest.xml để tránh dính cảnh báo theo dõi người dùng.',
      'Test kiểm tra hiệu năng (Profiling) trên các dòng máy phân khúc giá rẻ để đảm bảm khung hình tối thiểu 60 FPS.'
    ],
    codeTemplate: `// Gradle configuration file snippet (build.gradle) - Target Android API
android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "com.solofounder.ninjajump"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
    }
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}`,
    codeLanguage: 'groovy'
  },
  {
    id: 'stage_compliance',
    phaseCode: 'STAGE 5',
    title: 'Pháp Lý Việt Nam & Phát Hành Toàn Cầu',
    subtitle: 'Nghị định 72, xin giấy phép G1/G2/G3/G4',
    description: 'Quy trình khai báo và phân phối ứng dụng hợp hiến đúng luật pháp tại Việt Nam. Xử lý biểu thuế 15% của Apple/Google đối với các nhà sáng lập độc lập có doanh thu dưới $1M hằng năm.',
    vnAdvisory: 'Với game mobile tại Việt Nam có tương tác nhiều người chơi hoặc nạp thẻ cào trực tiếp bắt buộc phải được thẩm định phê duyệt kịch bản G1. Các game Offline thuần túy chỉ thanh toán qua Google Play/IAP khuyên nộp đơn tự khai báo G2/G4.',
    tools: ['Cục Phát thanh, truyền hình và thông tin điện tử', 'Tờ khai thuế cá nhân', 'Apple App Store Connect'],
    durationWeeks: 3,
    tasks: [
      'Gửi văn bản hồ sơ G2/G4 cho cơ quan quản lý trước khi chạy quảng cáo quy mô rộng trong nước.',
      'Cài đặt bảng xếp hạng độ tuổi người chơi gắn nhãn phân phối 12+ hoặc 16+ chuẩn mực.',
      'Cấu hình biểu mẫu Thuế Hoa Kỳ (W-8BEN) trên App Store Connect để giảm tải trừ thuế trùng thuế kép.'
    ],
    codeTemplate: `// Bản Kế Hoạch Tuân Thủ Giấy Phép Game Việt Nam 0đ
- Loại game: G4 (Game offline thuần túy, tải không thu tiền trực tiếp qua tổng đài, chỉ có IAP thông qua Gate Store)
- Hồ sơ pháp lý: Gửi thông báo cung cấp dịch vụ trò chơi điện tử G4 lên Bộ Thông tin và Truyền thông.
- Bộ lọc từ ngữ (Chat filter): Nếu có chức năng lưu tên người chơi, lắp đặt Regex tự động loại trừ các từ ngữ phản cảm hoặc chính trị nhạy cảm.
- Địa chỉ lưu trữ máy chủ: Nếu thu giữ thông tin người dùng, lưu giữ trên DB Supabase đặt tại Singapore hoặc máy chủ Cloud trong nước theo Luật An ninh mạng Việt Nam.`,
    codeLanguage: 'markdown'
  }
];

const ML_MODELS: MLModelDetail[] = [
  {
    id: 'mlp',
    name: 'Mạng Nơ-ron Đa Tầng (Multi-Layer Perceptron)',
    subtitle: 'Nền móng của Trí tuệ Nhân tạo hiện đại',
    archDescription: 'Kết nối hoàn toàn (Fully-connected) giữa các tầng Nơ-ron. Thông tin đi thẳng qua Tầng Vào (Input), ẩn (Hidden) rồi đi ra ở Tầng Ra (Output) thông qua các trọng số (Weights) và độ lệch (Biases). Lan truyền ngược (Backpropagation) sử dụng giải thuật tối ưu hóa Gradient Descent độ dốc để cập nhật trọng số giảm thiểu sai số.',
    useCase: 'Phân loại rủi ro nợ xấu kế toán, phát hiện giao dịch gian lận đột biến từ ngân hàng ròng rã.',
    mathFormula: 'y = f( W_2 \\cdot f( W_1 \\cdot x + b_1 ) + b_2 )',
    pythonSnippet: `import torch
import torch.nn as nn

class FraudClassifierMLP(nn.Module):
    def __init__(self, input_dim):
        super(FraudClassifierMLP, self).__init__()
        # Cấu trúc: Input -> 32 Nơ-ron Ẩn -> 16 Nơ-ron Ẩn -> Output Phân Loại 0/1
        self.network = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.ReLU(), # Hàm kích hoạt phi tuyến tính ReLU giúp mạng học liên kết phức tạp
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid() # Sigmoid xuất ra xác suất từ 0% đến 100% gian lận
        )
        
    def forward(self, x):
        return self.network(x)

# Giả sử đầu vào gồm 6 đặc trưng số liệu giao dịch
model = FraudClassifierMLP(input_dim=6)
print(model)`
  },
  {
    id: 'transformer',
    name: 'Kiến Trúc Transformer (Cơ chế Tự Chú Ý)',
    subtitle: 'Động cơ đứng sau ChatGPT và Gemini API',
    archDescription: 'Cơ chế kích hoạt tính toán Self-Attention (Tự Chú Ý) cho phép mô hình đánh giá mức độ liên kết chặt chẽ giữa các từ, ký tự trong một câu bất chấp khoảng cách địa lý ký tự xa gần thế nào. Không cần xử lý tuần tự chậm chạp như LSTM/RNN, Transformer tính toán song song mang lại tốc độ và độ thông tuệ vượt trội.',
    useCase: 'Semantic search hạch toán, AI bóc tách hóa đơn, tự động biên dịch báo cáo tài chính thô.',
    mathFormula: 'Attention(Q, K, V) = softmax( \\frac{Q K^T}{\\sqrt{d_k}} ) V',
    pythonSnippet: `import torch
import torch.nn as nn
import math

class SelfAttentionBlock(nn.Module):
    def __init__(self, d_model):
        super(SelfAttentionBlock, self).__init__()
        # Tạo 3 ma trận Query, Key, Value
        self.query = nn.Linear(d_model, d_model)
        self.key = nn.Linear(d_model, d_model)
        self.value = nn.Linear(d_model, d_model)
        self.scale = math.sqrt(d_model)

    def forward(self, x):
        Q = self.query(x)
        K = self.key(x)
        V = self.value(x)
        
        # Công thức tích vô hướng Attention Score
        scores = torch.matmul(Q, K.transpose(-2, -1)) / self.scale
        attention_weights = torch.softmax(scores, dim=-1)
        
        # Nhân trọng số chú ý chú thích với Vector giá trị
        return torch.matmul(attention_weights, V)`
  },
  {
    id: 'cnn',
    name: 'Mạng Nơ-ron Tích Chập (Convolutional Neural Network)',
    subtitle: 'Thần nhãn nhận diện tầm nhìn máy tính',
    archDescription: 'Sử dụng các ma trận nhỏ quét (Filter Kernels) trượt tuần tự qua không gian ảnh để bóc tách các đặc trưng biên cạnh, đường ranh giới và kết cấu hình dạng (Edges & Textures). Giảm bớt số lượng tham số kết nối khổng lồ thông qua các tầng gộp dồn (Pooling Layers).',
    useCase: 'Trích xuất chữ viết tay sổ sách, scan định dạng chứng từ hóa đơn, quét mã vạch kho vận tự động.',
    mathFormula: 'S(i,j) = (I * K)(i,j) = \\sum_m \\sum_n I(i-m, j-n) K(m,n)',
    pythonSnippet: `import torch
import torch.nn as nn

class OCRFilterCNN(nn.Module):
    def __init__(self):
        super(OCRFilterCNN, self).__init__()
        # Layer tích chập 2D quét qua ảnh hóa đơn đen trắng
        self.features = nn.Sequential(
            # Quét ảnh 1 kênh đầu vào -> 16 kênh đặc trưng, kích thước Kernel 3x3
            nn.Conv2d(1, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            # Co rút kích thước ảnh xuống 2 lần để giảm chiều dữ liệu nhiễu
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        
    def forward(self, x):
        return self.features(x)

cnn_extractor = OCRFilterCNN()
print(cnn_extractor)`
  }
];

interface LifecycleStage {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  description: string;
  advantages: string;
  recommends: string;
  code: string;
  codeLanguage: string;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: 'data_prep',
    stepNumber: 'STAGE 1',
    title: 'Kỹ nghệ dữ liệu & Outlier Shielding',
    subtitle: 'Làm sạch nhiễu & Chuẩn hóa RobustScaler',
    description: 'Xử lý các điểm dữ liệu nhiễu (outliers) cực đoan trong tập dữ liệu thô. Thay vì dùng StandardScaler dễ bị lệch do số tiền giao dịch khổng lồ đột biến (ví dụ: cá mập nạp game), ta sử dụng RobustScaler dựa trên Median và IQR (Interquartile Range) để giữ tính khách quan cao nhất cho mô hình học tập.',
    advantages: 'Hạn chế méo mó hàm mất mát, tăng 12-18% tốc độ hội tụ của Gradient Descent.',
    recommends: 'Scikit-learn RobustScaler, Pandas Boxplot Analysis, Isolation Forest.',
    code: `import pandas as pd
from sklearn.preprocessing import RobustScaler

# Dữ liệu nạp thẻ/giao dịch tài chính có cá mập nạp khủng (outlier)
data = pd.DataFrame({'transaction_amount': [10, 15, 12, 11, 10000, 14, 11, 13, 8, 9]})

# Sử dụng RobustScaler dựa trên Median và IQR (Không nhạy cảm với outlier)
scaler = RobustScaler()
scaled_data = scaler.fit_transform(data[['transaction_amount']])

data['scaled_amount'] = scaled_data
print("Dữ liệu gốc và dữ liệu sau chuẩn hóa kháng Outlier:")
print(data)`,
    codeLanguage: 'python'
  },
  {
    id: 'training_tuning',
    stepNumber: 'STAGE 2',
    title: 'Overfitting Shielding / Kỹ nghệ tránh rỗng học',
    subtitle: 'Dropout & Early Stopping trong thực tế',
    description: 'Overfitting xảy ra khi mô hình học thuộc lòng bộ dữ liệu train nhưng mất khả năng tổng quát hóa dữ liệu thực tế (Val/Test Loss tăng vọt dù Train Loss tiến dần về 0). Áp dụng kỹ thuật ngắt nơ-ron ngẫu nhiên (Dropout) và dừng sớm (Early Stopping) khi kiểm định không còn tiến bộ.',
    advantages: 'Bảo vệ mô hình trước dữ liệu lạ, giảm lãng phí tài nguyên GPU hằng ngày.',
    recommends: 'PyTorch EarlyStopping Callbacks, Dropout (p=0.3), L2 Regularization (Weight Decay).',
    code: `# Định nghĩa Callback Early Stopping tùy chỉnh trong PyTorch
import torch

class EarlyStopping:
    def __init__(self, patience=5, min_delta=1e-4):
        self.patience = patience
        self.min_delta = min_delta
        self.counter = 0
        self.best_loss = None
        self.early_stop = False

    def step(self, val_loss):
        if self.best_loss is None:
            self.best_loss = val_loss
        elif val_loss > self.best_loss - self.min_delta:
            self.counter += 1
            if self.counter >= self.patience:
                self.counter = 0
                self.early_stop = True
                print("🛑 Đã dừng sớm! Tránh Overfitting rực rỡ.")
        else:
            self.best_loss = val_loss
            self.counter = 0`,
    codeLanguage: 'python'
  },
  {
    id: 'convert_quantize',
    stepNumber: 'STAGE 3',
    title: 'Model Quantization / Cắt nén lượng tử học',
    subtitle: 'Nén từ FP32 (32-bit float) xuống INT8 (8-bit integer)',
    description: 'Chuyển đổi trọng số (weights) của mô hình từ kiểu số thực có dấu phẩy động 32-bit (highly precise nhưng siêu tốn bộ nhớ) về số nguyên 8-bit. Việc lượng tử hóa Post-Training Static Quantization (PTQ) giúp co nén mô hình đến 4 lần với sai lệch độ chính xác dốc cực thấp và tối ưu hóa vượt bậc phần cứng Edge di động.',
    advantages: 'Giảm 75% dung lượng file tệp (.onnx), gia tốc xử lý cực nhanh trên điện thoại.',
    recommends: 'Intel OpenVINO, PyTorch Quantization API, TensorFlow Lite Converter.',
    code: `import torch
import torch.ao.quantization as quantization

# Đưa mô hình MLP hoặc CNN sẵn có vào cấu trúc lượng tử hóa tĩnh
model = MyPretrainedModel()
model.eval()

# Chỉ định cấu hình lượng tử hóa cho thiết bị di động (ARM - qnnpack)
model.qconfig = quantization.get_default_qconfig('qnnpack')

# Chuẩn bị mô hình (chèn các nút đo lường phân phối kích hoạt)
model_prepared = quantization.prepare(model, inplace=False)

# Chạy một vài lô dữ liệu mẫu (Calibration) để ghi nhận dải giá trị cực trị
# rã calibration_data đại diện...
# quantization.validate(model_prepared, calibration_loader)

# Thực thi lượng tử hóa thực tế sang kiểu dữ liệu số nguyên INT8
model_quantized = quantization.convert(model_prepared, inplace=False)
print("Quantized Model compiled successfully!")`,
    codeLanguage: 'python'
  },
  {
    id: 'deploy_edge',
    stepNumber: 'STAGE 4',
    title: 'Biên dịch ONNX & Triển khai cục bộ trong Client',
    subtitle: 'Nạp mô hình thông minh chạy mượt không cần Internet',
    description: 'Xuất mô hình AI từ Python (PyTorch/TensorFlow) sang định dạng chuẩn chung toàn cầu ONNX (Open Neural Network Exchange). Sau đó, lập trình viên Game tải trực tiếp tệp .onnx này vào Unity Engine sử dụng Unity Sentis hoặc vào trình duyệt Web bằng WebGL & onnxruntime.js để AI suy luận (inference) ngay trên thiết bị người chơi.',
    advantages: 'Thời gian trễ bằng 0ms, không tốn tiền duy trì máy chủ API, bảo mật dữ liệu tuyệt đối.',
    recommends: 'Unity Sentis SDK, ONNX Runtime Web WebGL, WebAssembly Acceleration.',
    code: `// Đoạn Code C# Unity Sentis - Nạp tệp AI (.onnx) chạy trực tiếp trong Game Loop
using UnityEngine;
using Unity.Sentis;

public class GameAIController : MonoBehaviour
{
    public ModelAsset onnxModelAsset; // Gán kéo tệp .onnx trực tiếp trong Unity Editor
    private IWorker worker;

    void Start()
    {
        // Khởi tạo mô hình ONNX cực nhanh sử dụng CPU hoặc GPU cục bộ trên Mobile
        Model runtimeModel = ModelLoader.Load(onnxModelAsset);
        worker = WorkerFactory.CreateWorker(BackendType.GPUCompute, runtimeModel);
    }

    public float PredictIsHacker(float[] touchSpeedsAndAngles)
    {
        // Đóng chuyển đổi tệp mảng vào Tensor
        using TensorFloat inputTensor = new TensorFloat(new TensorShape(1, touchSpeedsAndAngles.Length), touchSpeedsAndAngles);
        worker.Execute(inputTensor);
        
        // Trích kết quả suy luận AI từ Node Output ròng rã
        using TensorFloat outputTensor = worker.PeekOutput() as TensorFloat;
        outputTensor.MakeReadable();
        
        return outputTensor[0]; // Trả về xác suất gian lận của người chơi
    }

    void OnDestroy() { worker?.Dispose(); }
}`,
    codeLanguage: 'csharp'
  },
  {
    id: 'ab_test',
    stepNumber: 'STAGE 5',
    title: 'A/B Testing & Giám sát Data Drift / Concept Drift',
    subtitle: 'Theo dõi sự "già cỗi" của Mô hình AI trong Đời Thực',
    description: 'Sau khi triển khai, mô hình AI sẽ giảm sút hiệu năng (accuracy decay) theo thời gian. Có hai tác nhân chính: Data Drift (Dữ liệu thực tế thay đổi so với phân phối tập train) và Concept Drift (Sự thay đổi bản chất của thực thể, ví dụ: hành vi gian lận mới xuất hiện trong game). Ta cần thực hiện A/B Testing hai phiên bản mô hình song song để cập nhật.',
    advantages: 'Đảm bảo độ thông thái của AI trường tồn, phát hiện kịp thời lỗ hổng bảo mật.',
    recommends: 'Evidently AI (Python Monitor), MLflow Registry, Triton Inference Server.',
    code: `# Giả lập đo lường khoảng cách phân phối Kolmogorov-Smirnov (KS-Test)
import numpy as np
from scipy import stats

# Phân phối dữ liệu tập train cũ (chi phí nạp thẻ)
train_distribution = np.random.normal(loc=150, scale=30, size=1000)

# Dữ liệu thực tế tháng mới thu thập từ Game Client
production_data = np.random.normal(loc=175, scale=40, size=1000) # Trung bình tăng vọt!

# Thực thi KS-test để phát hiện Data Drift
ks_stat, p_value = stats.ks_2samp(train_distribution, production_data)

if p_value < 0.05:
    print(f"🚨 Phát hiện DATA DRIFT! P-value: {p_value:.6f}. Cần kích hoạt huấn luyện lại ròng rã!")
else:
    print("✅ Phân phối dữ liệu ổn định, mô hình AI đang vận hành xuất sắc.")`,
    codeLanguage: 'python'
  }
];

export default function GameAndMLWorkbench() {
  const [activeTab, setActiveTab] = useState<'game' | 'ml' | 'monetization' | 'crossplatform' | 'analytics'>('game');

  // --- Game Tab States ---
  const [selectedStageId, setSelectedStageId] = useState<string>('stage_gdd');
  const [copiedCodeFlag, setCopiedCodeFlag] = useState<boolean>(false);
  
  // Game custom calculator configs
  const [gameGenre, setGameGenre] = useState<'hypercasual' | 'casual_puzzle' | 'rpg_multiplayer'>('hypercasual');
  const [monetization, setMonetization] = useState<'ads_only' | 'hybrid' | 'iap_g1'>('ads_only');
  const [assetSource, setAssetSource] = useState<'free_ai' | 'hire_freelancer'>('free_ai');

  // --- ML Tab States ---
  const [mlSubTab, setMlSubTab] = useState<'simulation' | 'lifecycle' | 'beginner'>('simulation');
  const [quantLevel, setQuantLevel] = useState<'fp32' | 'fp16' | 'int8'>('fp32');
  const [quantCalib, setQuantCalib] = useState<'minmax' | 'entropy' | 'percentile'>('minmax');
  const [selectedLifeStage, setSelectedLifeStage] = useState<'data_prep' | 'training_tuning' | 'convert_quantize' | 'deploy_edge' | 'ab_test'>('deploy_edge');
  
  const [outlierVal, setOutlierVal] = useState<number>(2000);
  const [dropoutRate, setDropoutRate] = useState<number>(30);
  const [dailyDau, setDailyDau] = useState<number>(50000);
  const [driftFactor, setDriftFactor] = useState<number>(20);

  // States for Beginner Tab
  const [metricsThreshold, setMetricsThreshold] = useState<number>(0.5);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<'supervised' | 'unsupervised' | 'reinforcement'>('supervised');

  // --- ML Tab States ---
  const [selectedMLModelId, setSelectedMLModelId] = useState<string>('mlp');
  const [learningRate, setLearningRate] = useState<number>(0.05);
  const [epochsCount, setEpochsCount] = useState<number>(100);
  const [hiddenLayers, setHiddenLayers] = useState<number>(2);
  const [activationFunc, setActivationFunc] = useState<'relu' | 'sigmoid' | 'tanh'>('relu');
  
  // Simulated training variables
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [trainingLossData, setTrainingLossData] = useState<{ epoch: number; trainLoss: number; valLoss: number; accuracy: number }[]>([]);
  const [activeSignalPath, setActiveSignalPath] = useState<boolean>(false);

  // --- New Game Monetization States ---
  const [monetDAU, setMonetDAU] = useState<number>(5000);
  const [monetCTR, setMonetCTR] = useState<number>(1.5);
  const [monetECPM, setMonetECPM] = useState<number>(2.0);

  // --- New Interactivities for Godot 4.6 & Core Platform Comparison (Page 5, 6 & 7) ---
  const [godotRevenue, setGodotRevenue] = useState<number>(300000); // Expected Revenue in USD
  const [godotDownloads, setGodotDownloads] = useState<number>(600000); // Expected downloads
  const [godotSelectedNode, setGodotSelectedNode] = useState<'player' | 'enemy' | 'ui'>('player');

  // Synchronous effect for copy code feedback
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeFlag(true);
    setTimeout(() => setCopiedCodeFlag(false), 2000);
  };

  // --- Synthetic Dataset & Confusion Matrix calculation for ML Beginners ---
  const syntheticPlayers = React.useMemo(() => {
    const arr = [];
    // 30 actual hackers
    for (let i = 0; i < 30; i++) {
      const baseProb = 0.42 + ((i * 19) % 57) / 100; // deterministic pseudo-random [0.42, 0.99]
      arr.push({ id: `hacker-${i}`, actual: true, prob: baseProb });
    }
    // 70 actual clean players
    for (let i = 0; i < 70; i++) {
      const baseProb = 0.01 + ((i * 29) % 59) / 100; // deterministic pseudo-random [0.01, 0.59]
      arr.push({ id: `clean-${i}`, actual: false, prob: baseProb });
    }
    return arr;
  }, []);

  const { tp, fp, fn, tn, tfTotal } = React.useMemo(() => {
    let tpCount = 0, fpCount = 0, fnCount = 0, tnCount = 0;
    syntheticPlayers.forEach(p => {
      const predicted = p.prob >= metricsThreshold;
      if (p.actual && predicted) tpCount++;
      else if (!p.actual && predicted) fpCount++;
      else if (p.actual && !predicted) fnCount++;
      else if (!p.actual && !predicted) tnCount++;
    });
    return { tp: tpCount, fp: fpCount, fn: fnCount, tn: tnCount, tfTotal: syntheticPlayers.length };
  }, [syntheticPlayers, metricsThreshold]);

  const accVal = (tp + tn) / tfTotal;
  const precVal = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recVal = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1Val = (precVal + recVal) > 0 ? 2 * (precVal * recVal) / (precVal + recVal) : 0;

  // --- Calculate estimated Game development values ---
  const estimateGameProject = () => {
    let baseCost = 0; // in VND Million
    let workWeeks = 8;
    let potentialArpu = 500; // in VND per user click/session

    // Genre impact
    if (gameGenre === 'hypercasual') {
      baseCost += 5;
      workWeeks = 6;
      potentialArpu = 350;
    } else if (gameGenre === 'casual_puzzle') {
      baseCost += 20;
      workWeeks = 12;
      potentialArpu = 1200;
    } else if (gameGenre === 'rpg_multiplayer') {
      baseCost += 150;
      workWeeks = 36;
      potentialArpu = 8500;
    }

    // Asset sourcing impact
    if (assetSource === 'hire_freelancer') {
      baseCost += gameGenre === 'hypercasual' ? 12 : gameGenre === 'casual_puzzle' ? 35 : 180;
    } else {
      // Free AI / asset stores
      baseCost += 0.5; // Hosting or subscription only
    }

    // Monetization impact on complexity
    if (monetization === 'hybrid') {
      baseCost += 5;
      workWeeks += 2;
    } else if (monetization === 'iap_g1') {
      baseCost += 40; // Giấy phép G1 thẩm định, luật sư hỗ trợ nộp hồ sơ
      workWeeks += 6;
    }

    return {
      estimatedCost: baseCost,
      estimatedWeeks: workWeeks,
      estimatedArpu: potentialArpu,
      regulatoryComplexity: monetization === 'iap_g1' ? 'Cực Kỳ Phức Tạp (Giấy Phép G1 cấp Bộ phê duyệt)' : 'Thước đo G4 dễ khai báo (Cục Phát thanh TH & TTĐT)'
    };
  };

  const projectEstimation = estimateGameProject();

  // --- Machine Learning simulation engine ---
  useEffect(() => {
    let interval: any = null;
    if (isTraining) {
      interval = setInterval(() => {
        setCurrentEpoch(prev => {
          if (prev >= epochsCount) {
            setIsTraining(false);
            clearInterval(interval);
            return prev;
          }
          
          const nextEpoch = prev + 5;
          const trainingFactor = Math.max(0.01, 1 - (learningRate * (nextEpoch / 30)));
          
          // Logistic decline curve for simulated loss
          const simulatedTrainLoss = Math.max(0.015, (0.85 / (1 + (nextEpoch * learningRate * 0.15))) + (Math.random() * 0.02 * trainingFactor));
          const simulatedValLoss = Math.max(0.029, (0.89 / (1 + (nextEpoch * learningRate * 0.13))) + (Math.random() * 0.04 * trainingFactor));
          const simulatedAccuracy = Math.min(0.992, 0.45 + (0.54 * (1 - simulatedTrainLoss)) + (Math.random() * 0.01));

          setTrainingLossData(prevData => [
            ...prevData,
            {
              epoch: nextEpoch,
              trainLoss: Number(simulatedTrainLoss.toFixed(4)),
              valLoss: Number(simulatedValLoss.toFixed(4)),
              accuracy: Number((simulatedAccuracy * 100).toFixed(1))
            }
          ]);

          // Flash active signal path light
          setActiveSignalPath(p => !p);

          return nextEpoch;
        });
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTraining, learningRate, epochsCount, hiddenLayers, activationFunc]);

  const startSimulatedTraining = () => {
    setIsTraining(true);
    setCurrentEpoch(0);
    // Seed point 0
    setTrainingLossData([{
      epoch: 0,
      trainLoss: 0.8900,
      valLoss: 0.9450,
      accuracy: 45.2
    }]);
  };

  const resetMLSimulation = () => {
    setIsTraining(false);
    setCurrentEpoch(0);
    setTrainingLossData([]);
  };

  const activeStage = GAME_STAGES.find(s => s.id === selectedStageId) || GAME_STAGES[0];
  const activeMLModel = ML_MODELS.find(m => m.id === selectedMLModelId) || ML_MODELS[0];

  return (
    <div id="game_ml_workbench" className="space-y-6 text-slate-100 select-text pb-12">
      
      {/* SECTION HEADER CARD */}
      <section className="bg-gradient-to-r from-purple-950/20 via-[#060a12] to-sky-950/20 border border-border-primary rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-cyan-500/5 blur-3xl animate-pulse"></div>
        <div className="absolute left-1/4 bottom-0 w-32 h-32 rounded-full bg-purple-500/5 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-start gap-4 md:items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-lg">
              <Gamepad2 className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                🎮 GAME MOBILE & MACHINE LEARNING LABS
                <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/25 text-[9px] font-black rounded font-mono">WORKSPACE EXTRAS</span>
              </h1>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed max-w-4xl font-semibold">
                Sân chơi tích hợp mới giúp lập kế hoạch dự toán dự án Game Mobile, dọn dẹp quy trình kỹ thuật lập trình và học tập trực quan cấu trúc mạng nơ-ron sâu (Neural Networks) hoàn chỉnh.
              </p>
            </div>
          </div>
        </div>

        {/* TAB CHOOSER */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-slate-900 pt-5">
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
              activeTab === 'game'
                ? 'bg-sky-600 border-sky-505 text-text-primary shadow-lg shadow-sky-500/10'
                : 'bg-slate-950 border-slate-850 text-text-secondary hover:text-text-primary'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Lập Dự Án Game Mobile & Software
          </button>
          
          <button
            onClick={() => setActiveTab('ml')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
              activeTab === 'ml'
                ? 'bg-purple-600 border-purple-505 text-text-primary shadow-lg shadow-purple-500/10'
                : 'bg-slate-950 border-slate-850 text-text-secondary hover:text-text-primary'
            }`}
          >
            <Brain className="w-4 h-4" />
            Machine Learning Visual Labs
          </button>

          <button
            onClick={() => setActiveTab('monetization')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
              activeTab === 'monetization'
                ? 'bg-amber-600 border-amber-505 text-text-primary shadow-lg shadow-amber-500/10'
                : 'bg-slate-950 border-slate-850 text-text-secondary hover:text-text-primary'
            }`}
          >
            <Coins className="w-4 h-4" />
            Monetization Game Mobile
          </button>

          <button
            onClick={() => setActiveTab('crossplatform')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
              activeTab === 'crossplatform'
                ? 'bg-emerald-600 border-emerald-505 text-text-primary shadow-lg shadow-emerald-500/10'
                : 'bg-slate-950 border-slate-850 text-text-secondary hover:text-text-primary'
            }`}
          >
            <Layers className="w-4 h-4" />
            Cross-platform Stack
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
              activeTab === 'analytics'
                ? 'bg-rose-600 border-rose-505 text-text-primary shadow-lg shadow-rose-500/10'
                : 'bg-slate-950 border-slate-850 text-text-secondary hover:text-text-primary'
            }`}
          >
            <LineChart className="w-4 h-4" />
            Game Analytics & Retention
          </button>
        </div>
      </section>

      {/* ======================= TAB 1: GAME MOBILE & SOFTWARE LOBBY ======================= */}
      {activeTab === 'game' && (
        <div className="space-y-6">
          
          {/* A. INTERACTIVE CONSOLE GAME PROJECT ESTIMATOR */}
          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Input variables configuration options */}
            <div className="lg:col-span-6 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-450 font-mono flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  Bục cấu hình chỉ số game & app mong muốn
                </span>
                <h3 className="text-sm font-black text-text-primary uppercase tracking-tight mt-1.5">
                  🕹️ Trình Giả Lập Ngân Sách Dự Án Mobile Game
                </h3>
                <p className="text-[11px] text-text-secondary leading-normal font-medium mt-1">
                  Nhấp tinh chỉnh thể loại, cách thức khai thác nguồn tài nguyên đồ họa và thủ tục pháp lý để đo lường công gieo mồ hôi của nhà sáng lập:
                </p>
              </div>

              {/* Selector panels */}
              <div className="space-y-3 pt-2">
                {/* 1. Genre selection */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-bold text-text-secondary block">Thể loại trò chơi (Game Genre):</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'hypercasual', label: 'Hyper-Casual', desc: 'Dễ chơi, nhẹ nhàng' },
                      { id: 'casual_puzzle', label: 'Casual Puzzle', desc: 'Xếp hình, trí óc' },
                      { id: 'rpg_multiplayer', label: 'RPG Online', desc: 'Nạp thẻ, dữ liệu khủng' }
                    ].map(g => (
                      <button
                        key={g.id}
                        onClick={() => setGameGenre(g.id as any)}
                        className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                          gameGenre === g.id
                            ? 'bg-sky-500/10 border-sky-500 text-text-primary shadow'
                            : 'bg-[#040810] border-slate-850 text-text-secondary hover:text-slate-200'
                        }`}
                      >
                        <span className="text-[11px] font-black block">{g.label}</span>
                        <span className="text-[9px] text-text-tertiary font-medium block mt-0.5 leading-none">{g.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Sourcing Graphic Assets */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-bold text-text-secondary block">Nguồn tài nguyên đồ hoạ & âm thanh:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAssetSource('free_ai')}
                      className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                        assetSource === 'free_ai'
                          ? 'bg-sky-500/10 border-sky-500 text-text-primary shadow'
                          : 'bg-[#040810] border-slate-850 text-text-secondary hover:text-slate-200'
                      }`}
                    >
                      <span className="text-[11px] font-black block">🎨 AI Gen + Asset Stores 0đ</span>
                      <span className="text-[9px] text-text-tertiary font-medium block mt-1 leading-normal">
                        Khai thác ảnh bối cảnh từ Midjourney, SFX từ thư viện itch.io hoàn toàn miễn phí.
                      </span>
                    </button>

                    <button
                      onClick={() => setAssetSource('hire_freelancer')}
                      className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                        assetSource === 'hire_freelancer'
                          ? 'bg-sky-500/10 border-sky-500 text-text-primary shadow'
                          : 'bg-[#040810] border-slate-850 text-text-secondary hover:text-slate-200'
                      }`}
                    >
                      <span className="text-[11px] font-black block">💼 Thuê ngoài Freelancer</span>
                      <span className="text-[9px] text-text-tertiary font-medium block mt-1 leading-normal">
                        Thuê vẽ 2D Spine Animation, tạo hình nhân vật độc quyền trên hù hụi Vietnam Behance.
                      </span>
                    </button>
                  </div>
                </div>

                {/* 3. Monetization style */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-bold text-text-secondary block">Phương thức hái tiền chủ đạo:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'ads_only', label: 'Ads (Chỉ Quảng Cáo)', desc: 'Hiện banner, Interstitial' },
                      { id: 'hybrid', label: 'Hybrid (Quảng cáo + IAP)', desc: 'Thưởng & nạp một phần' },
                      { id: 'iap_g1', label: 'Nạp Thẻ Giao Dịch G1', desc: 'Bán vật phẩm trực tiếp' }
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setMonetization(m.id as any)}
                        className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                          monetization === m.id
                            ? 'bg-sky-500/10 border-sky-500 text-text-primary shadow'
                            : 'bg-[#040810] border-slate-850 text-text-secondary hover:text-slate-200'
                        }`}
                      >
                        <span className="text-[11px] font-black block">{m.label}</span>
                        <span className="text-[9px] text-text-tertiary font-medium block mt-0.5 leading-none">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Warning/Tips */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-300 leading-normal font-medium mt-3">
                * Khuyến cáo Solo Founder: Mảng nạp thẻ G1 yêu cầu giấy phép cấp từ Bộ Thông tin & Truyền thông thời gian duyệt từ 2 - 4 tháng ròng rã. Nếu khởi đầu thô sơ, nên ưu tiên hình thức đăng quảng cáo AdMob làm sạch thuế dòng tiền!
              </div>
            </div>

            {/* Simulated Live Estimates & Financial Output */}
            <div className="lg:col-span-6 bg-bg-primary/40 border border-border-primary rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200 font-mono">
                    Dự Đoán Kết Quả Khởi Nghiệp Game
                  </span>
                  <span className="bg-sky-500/15 text-sky-450 text-[9.5px] font-black px-2 py-0.5 rounded border border-sky-500/25 uppercase font-mono">
                    ESTIMATED PROJECTIONS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#050a12]/60 p-3.5 rounded-xl border border-slate-850">
                    <span className="text-[9px] font-black text-text-tertiary uppercase block font-mono">Tổng giá trị đầu tư thô:</span>
                    <p className="text-lg font-black text-emerald-400 mt-1 leading-none">
                      {projectEstimation.estimatedCost === 0.5 ? 'Gần như 0 VNĐ!' : `~ ${projectEstimation.estimatedCost} Triệu VND`}
                    </p>
                    <span className="text-[9.5px] text-text-secondary font-semibold block mt-1">Host, Asset & Tools thô sơ</span>
                  </div>

                  <div className="bg-[#050a12]/60 p-3.5 rounded-xl border border-slate-850">
                    <span className="text-[9px] font-black text-text-tertiary uppercase block font-mono">Cột mốc bàn giao MVP:</span>
                    <p className="text-lg font-black text-sky-305 mt-1 leading-none">
                      {projectEstimation.estimatedWeeks} Tuần lễ
                    </p>
                    <span className="text-[9.5px] text-text-secondary font-semibold block mt-1">Lập trình phát triển thô</span>
                  </div>
                </div>

                {/* ARPU detail analysis */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 space-y-1">
                  <span className="text-[9.5px] uppercase font-mono text-text-secondary font-bold block">Xác suất Doanh thu kỳ vọng lũy tiến (ARPU):</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">ARPU ước lượng trên mỗi phiên xem quảng cáo:</span>
                    <span className="text-xs font-black text-orange-400 font-mono">~ {projectEstimation.estimatedArpu}đ / lượt</span>
                  </div>
                  <div className="h-1.5 w-full bg-bg-primary rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-350"
                      style={{ width: `${Math.min(100, (projectEstimation.estimatedArpu / 9000) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Regulatory analysis */}
                <div className="p-4 bg-gradient-to-br from-indigo-950/20 via-slate-950 to-transparent border border-indigo-900/30 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1 text-xs text-indigo-400 font-black uppercase font-mono">
                    <Compass className="w-4 h-4 shrink-0" />
                    Bản đồ Pháp chế Việt Nam tương ứng:
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                    {projectEstimation.regulatoryComplexity}
                  </p>
                  <p className="text-[10.5px] text-text-secondary leading-normal">
                    * Solo Founder nên phát hành game hướng ra thị trường nước ngoài (Global) để khai phá dòng Ads RPM lớn gấp 3-7 lần thị trường Việt Nam dẹp bỏ gánh nặng giấy phép nạp thẻ rườm rà.
                  </p>
                </div>
              </div>

              {/* Action trigger button */}
              <button 
                onClick={() => {
                  setSelectedStageId('stage_gdd');
                  const element = document.getElementById('interactive_gdd_map');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-slate-950 hover:bg-bg-primary text-slate-100 border border-border-primary rounded-xl py-2.5 text-xs font-black uppercase tracking-widest transition-all text-center"
              >
                Khám phá Sơ Đồ Quy Trình Thực Hiện Từng Bước ➔
              </button>
            </div>

          </div>

          {/* B. INTERACTIVE TIMELINE ROADMAP MINDMAP (THE CLICKABLE MAP) */}
          <div id="interactive_gdd_map" className="bg-bg-primary/60 border border-border-primary rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <span className="text-[10px] font-black text-sky-400 uppercase font-mono block tracking-widest">INTERACTIVE MINDMAP</span>
              <h2 className="text-sm font-black uppercase text-slate-100 mt-1 flex items-center gap-1.5 font-sans">
                🗺️ Sơ Đồ Tư Duy 5 Bước Ra Lò Game Mobile Kiệt Tác
              </h2>
              <p className="text-xs text-text-secondary mt-1 font-semibold leading-relaxed">
                Nhấn chọn tuần tự từng mốc rạng ngời bên dưới để bóc cấu trúc lập trình, hướng dẫn pháp lý và bản mẫu code ròng thực tế:
              </p>
            </div>

            {/* Horizontal representation of the lifecycle roadmap */}
            <div className="grid grid-cols-5 gap-3 border-b border-slate-850 pb-5">
              {GAME_STAGES.map((stage, idx) => {
                const isSelected = selectedStageId === stage.id;
                return (
                  <button
                    key={stage.id}
                    onClick={() => {
                      setSelectedStageId(stage.id);
                      setCopiedCodeFlag(false);
                    }}
                    className={`text-left p-3 rounded-2xl border transition-all h-full flex flex-col justify-between relative overflow-hidden group ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-500 shadow-md shadow-sky-500/5'
                        : 'bg-[#040810]/75 border-slate-850 hover:border-border-primary hover:bg-bg-primary/50'
                    }`}
                  >
                    <div>
                      {/* Top indicator */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded font-mono ${
                          isSelected ? 'bg-sky-500/20 text-sky-400' : 'bg-bg-surface text-text-secondary'
                        }`}>
                          {stage.phaseCode}
                        </span>
                        <span className="text-[10px] text-text-tertiary font-bold font-mono">~{stage.durationWeeks}w</span>
                      </div>
                      
                      <h4 className={`text-[11.5px] font-extrabold line-clamp-1 leading-normal ${
                        isSelected ? 'text-text-primary' : 'text-text-secondary'
                      }`}>
                        {stage.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 mt-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[8.5px] text-text-tertiary font-extrabold truncate uppercase font-mono">
                        {stage.tools[0]}
                      </span>
                    </div>

                    {/* Left active border marker */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-400 to-indigo-500"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Stage Details view */}
            <div className="grid lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Written advisory (7 cols) */}
              <div className="lg:col-span-6 bg-slate-950/50 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="border-b border-slate-900 pb-2 flex justify-between items-center bg-[#010408]/30 px-1 py-1 rounded">
                    <span className="text-[10px] font-bold text-sky-450 uppercase font-mono">
                      Hướng Dẫn Chi Tiết Triển Khai
                    </span>
                    <span className="bg-[#0b192c] text-sky-400 text-[9px] font-black px-2 py-0.5 rounded font-mono">
                      {activeStage.phaseCode} PLAN
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-text-primary">{activeStage.title}</h3>
                    <p className="text-[11px] text-slate-350 leading-relaxed font-semibold">{activeStage.description}</p>
                  </div>

                  {/* Vietnam localized guide box */}
                  <div className="p-3.5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-1">
                    <span className="text-[9.5px] uppercase font-mono text-indigo-400 font-extrabold block flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Lưu ý Việt hóa & Thuế phí địa bàn:
                    </span>
                    <p className="text-[10.5px] text-text-secondary leading-relaxed font-medium">
                      {activeStage.vnAdvisory}
                    </p>
                  </div>

                  {/* Actions checklists */}
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] uppercase font-mono text-text-secondary font-bold block">Các tệp việc tự cần làm trong tuần (Checklist):</span>
                    <ul className="space-y-1.5">
                      {activeStage.tasks.map((task, tidx) => (
                        <li key={tidx} className="flex items-start gap-2 text-[11px] font-medium text-text-secondary leading-normal">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Sourcing list of tools for this step */}
                <div className="pt-4 border-t border-slate-900 space-y-1.5">
                  <span className="text-[9.5px] uppercase font-mono text-text-tertiary font-bold block">Công cụ được khuyên dùng (Recommended Stack):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeStage.tools.map((tl, index) => (
                      <span key={index} className="bg-bg-primary text-text-secondary font-mono text-[10px] font-bold px-2.5 py-1 rounded border border-border-primary">
                        {tl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Code Sandbox Template snippet (6 cols) */}
              <div className="lg:col-span-6 bg-slate-950 rounded-2xl border border-slate-850 p-5 flex flex-col justify-between space-y-3 relative overflow-hidden">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <span className="text-[10px] uppercase font-mono text-text-secondary font-bold flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-sky-400 animate-pulse" />
                      Bộ khung Code / Blueprint mẫu chuẩn
                    </span>
                    <button
                      onClick={() => handleCopyCode(activeStage.codeTemplate)}
                      className="text-[9.5px] font-black text-sky-400 hover:text-text-primary bg-bg-primary border border-border-primary px-2.5 py-1 rounded transition-all flex items-center gap-1"
                    >
                      {copiedCodeFlag ? 'Đã sao chép' : 'Copy Code'}
                    </button>
                  </div>

                  <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                    * Đoạn code thô sơ này giúp định hình mô hình lập trình để Solo Founder tích hợp nhanh vào Engine phát triển game mobile:
                  </p>

                  <pre className="text-[10px] font-mono text-text-secondary overflow-x-auto max-h-[295px] scrollbar-thin scrollbar-thumb-slate-800 p-3 bg-[#03060c] rounded-xl border border-slate-900 leading-relaxed font-semibold">
                    {activeStage.codeTemplate}
                  </pre>
                </div>

                <div className="bg-[#050b12] p-2.5 rounded-xl border border-slate-850 text-[9.5px] text-text-secondary leading-normal font-sans italic">
                  * Chú ý: Toàn bộ code mẫu ở trên là code chuẩn sản xuất có thể dính kéo trực tiếp vào Editor để vận hành!
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ======================= TAB 2: MACHINE LEARNING LABS ======================= */}
      {activeTab === 'ml' && (
        <div className="space-y-6 select-text">
          
          {/* SUB-TAB SELECTOR GRID HEADER */}
          <div className="flex flex-col sm:flex-row border border-slate-850 p-3 rounded-2xl justify-between items-stretch sm:items-center bg-[#040810]/80 gap-3">
            <div className="flex items-center gap-2.5 pl-1.5">
              <Brain className="w-5 h-5 text-purple-400 rotate-12 shrink-0" />
              <div>
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest font-mono">LABORATORY MACHINE LEARNING</h3>
                <p className="text-[10px] text-text-secondary font-semibold leading-none mt-0.5">Trải nghiệm rèn luyện, kiểm toán mô hình sâu rực rỡ và chu trình triển khai Edge AI</p>
              </div>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap gap-1.5 shrink-0">
              <button
                onClick={() => setMlSubTab('simulation')}
                className={`px-3 py-2 rounded-xl text-[10.5px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                  mlSubTab === 'simulation'
                    ? 'bg-purple-600 text-text-primary shadow shadow-purple-500/10'
                    : 'text-text-secondary bg-slate-950 border border-slate-900 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>1. Giả Lập Huấn Luyện</span>
              </button>
              <button
                onClick={() => setMlSubTab('lifecycle')}
                className={`px-3 py-2 rounded-xl text-[10.5px] font-black transition-all flex items-center gap-1 cursor-pointer border border-transparent relative ${
                  mlSubTab === 'lifecycle'
                    ? 'bg-indigo-650 text-text-primary shadow shadow-indigo-550/10'
                    : 'text-text-secondary bg-slate-950 border border-slate-900 hover:text-slate-200'
                }`}
              >
                <Workflow className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>2. Chu Trình & Edge Deployment</span>
                <span className="absolute -top-1.5 -right-1 py-0.5 px-1.5 bg-rose-600 text-[6.5px] text-text-primary rounded-full font-black animate-bounce leading-none">Ưu Việt</span>
              </button>
              <button
                onClick={() => setMlSubTab('beginner')}
                className={`px-3 py-2 rounded-xl text-[10.5px] font-black transition-all flex items-center gap-1 cursor-pointer border border-transparent relative [content-visibility:auto] ${
                  mlSubTab === 'beginner'
                    ? 'bg-rose-650 text-text-primary shadow shadow-rose-550/10'
                    : 'text-text-secondary bg-slate-950 border border-slate-900 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-rose-450 animate-bounce" />
                <span>3. Nhập Môn & Evaluation Lab</span>
                <span className="absolute -top-1.5 -right-1 py-0.5 px-1.5 bg-emerald-600 text-[6.5px] text-text-primary rounded-full font-black animate-pulse leading-none">LÍNH MỚI</span>
              </button>
            </div>
          </div>

          {mlSubTab === 'simulation' && (
            <div className="space-y-6">
          
          {/* B. INTERACTIVE NEURAL NETWORK COMPILER & SIMULATOR */}
          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Tuning Controls (5 cols) */}
            <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 font-mono">HYPERPARAMETER TUNING</span>
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-tight mt-1.5">
                    ⚙️ Tự Chế Bộ Tham Số Huấn Luyện AI
                  </h3>
                  <p className="text-[11px] text-text-secondary leading-normal font-medium mt-1">
                    Thiết lập các thông số cơ sở toán học để kích hoạt giải thuật lan truyền ngược (Backpropagation) giả lập ngay trực quan:
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  {/* Model Choice selector */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black text-slate-350 block">Mô hình kiến trúc AI:</label>
                    <select 
                      value={selectedMLModelId}
                      onChange={(e) => {
                        setSelectedMLModelId(e.target.value);
                        resetMLSimulation();
                      }}
                      className="w-full bg-[#040810] border border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-purple-500"
                    >
                      <option value="mlp">Multi-Layer Perceptron (MLP)</option>
                      <option value="transformer">Transformer Self-Attention</option>
                      <option value="cnn">Convolutional Neural Net (CNN)</option>
                    </select>
                  </div>

                  {/* Learning Rate range input */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10.5px] font-black">
                      <span className="text-slate-350">Tỷ lệ Học tập (Learning Rate):</span>
                      <span className="text-purple-400 font-mono">{learningRate}</span>
                    </div>
                    <input 
                      type="range"
                      min="0.001"
                      max="0.5"
                      step="0.01"
                      value={learningRate}
                      onChange={(e) => {
                        setLearningRate(Number(e.target.value));
                        resetMLSimulation();
                      }}
                      className="w-full accent-purple-500 bg-bg-primary h-1 rounded"
                    />
                    <div className="flex justify-between text-[8px] text-text-tertiary font-bold font-mono">
                      <span>0.001 (Chậm - Khớp ròng)</span>
                      <span>0.5 (Nhanh - Dễ phân kỳ)</span>
                    </div>
                  </div>

                  {/* Epochs Count selector */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black text-slate-350 block">Số lượng Chu kỳ (Epochs):</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[50, 100, 250].map(ep => (
                        <button
                          key={ep}
                          onClick={() => {
                            setEpochsCount(ep);
                            resetMLSimulation();
                          }}
                          className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                            epochsCount === ep
                              ? 'bg-purple-500/15 border-purple-500 text-purple-400 shadow'
                              : 'bg-[#040810] border-slate-850 text-text-secondary hover:text-slate-200'
                          }`}
                        >
                          {ep} Epochs
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activation function Choice */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black text-slate-350 block">Activation Function (Hàm Kích Hoạt):</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'relu', label: 'ReLU', desc: 'max(0, x)' },
                        { id: 'sigmoid', label: 'Sigmoid', desc: '1/(1+e^-x)' },
                        { id: 'tanh', label: 'Tanh', desc: 'hyperbolic' }
                      ].map(act => (
                        <button
                          key={act.id}
                          onClick={() => {
                            setActivationFunc(act.id as any);
                            resetMLSimulation();
                          }}
                          className={`p-1.5 rounded-lg border text-left transition-all ${
                            activationFunc === act.id
                              ? 'bg-purple-500/15 border-purple-500 text-purple-400 shadow'
                              : 'bg-[#040810] border-slate-850 text-text-secondary hover:text-slate-200'
                          }`}
                        >
                          <span className="text-[10.5px] font-bold block">{act.label}</span>
                          <span className="text-[8px] text-text-tertiary font-medium block leading-none">{act.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons triggers */}
              <div className="space-y-2 border-t border-slate-900 pt-4">
                <div className="flex gap-2">
                  <button
                    onClick={startSimulatedTraining}
                    disabled={isTraining}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 text-text-primary font-black text-xs uppercase tracking-widest py-2.5 rounded-xl transition-all shadow shadow-purple-550/10 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    {isTraining ? 'Đang huấn luyện...' : 'Chạy Training'}
                  </button>
                  
                  <button
                    onClick={resetMLSimulation}
                    className="bg-bg-primary border border-border-primary p-2.5 rounded-xl hover:text-text-primary text-text-secondary transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                
                {isTraining && (
                  <div className="text-center text-[10px] text-purple-400 font-black animate-pulse uppercase tracking-wider">
                    ⚡ LAN TRUYỀN NGƯỢC (GRADIENT DESCENT) ĐANG CHẠY CHU KỲ {currentEpoch}/{epochsCount}...
                  </div>
                )}
              </div>
            </div>

            {/* Neural SVG Node visualizer & Live Charting (7 cols) */}
            <div className="lg:col-span-8 bg-bg-primary/40 border border-slate-850 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
              
              {/* Architecture diagram container */}
              <div className="space-y-3">
                <div className="border-b border-slate-850 pb-2 flex justify-between items-center bg-[#010408]/30 px-2 py-1.5 rounded">
                  <span className="text-[10px] font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-purple-400" />
                    Giả Lập Tầm Nhìn Lan Truyền Mạng Nơ-ron (Loss Minimization)
                  </span>
                  <span className="bg-purple-500/10 text-purple-400 text-[9px] font-black px-2 py-0.5 rounded border border-purple-500/25 uppercase font-mono">
                    NEURAL FLOW VISUALIZER
                  </span>
                </div>

                {/* Simulated Weights SVG representation */}
                <div className="h-28 bg-[#040810] rounded-xl border border-slate-900 relative flex items-center justify-around px-8 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.03),transparent_70%)]"></div>
                  
                  {/* Layer Inputs */}
                  <div className="flex flex-col gap-2 relative z-10">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded-full border border-border-secondary bg-bg-surface ${isTraining ? 'animate-ping' : ''}`}></div>
                        <span className="text-[8px] font-mono text-text-secondary">X{n}</span>
                      </div>
                    ))}
                  </div>

                  {/* Weight Synapses Vector lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <line x1="15%" y1="20%" x2="50%" y2="25%" stroke={activeSignalPath ? '#c084fc' : '#334155'} strokeWidth="1" strokeDasharray={isTraining ? '2 2' : 'none'} />
                      <line x1="15%" y1="20%" x2="50%" y2="50%" stroke={activeSignalPath ? '#818cf8' : '#334155'} strokeWidth="1" />
                      <line x1="15%" y1="50%" x2="50%" y2="25%" stroke="#334155" strokeWidth="1" />
                      <line x1="15%" y1="50%" x2="50%" y2="50%" stroke={activeSignalPath ? '#c084fc' : '#334155'} strokeWidth="1.5" />
                      <line x1="15%" y1="50%" x2="50%" y2="75%" stroke="#334155" strokeWidth="1" />
                      <line x1="15%" y1="80%" x2="50%" y2="50%" stroke="#334155" strokeWidth="1" />
                      <line x1="15%" y1="80%" x2="50%" y2="75%" stroke={activeSignalPath ? '#818cf8' : '#334155'} strokeWidth="1" />
                      
                      <line x1="50%" y1="25%" x2="85%" y2="50%" stroke={activeSignalPath ? '#c084fc' : '#334155'} strokeWidth="1" />
                      <line x1="50%" y1="50%" x2="85%" y2="50%" stroke={activeSignalPath ? '#818cf8' : '#334155'} strokeWidth="1.5" />
                      <line x1="50%" y1="75%" x2="85%" y2="50%" stroke={activeSignalPath ? '#c084fc' : '#334155'} strokeWidth="1" />
                    </svg>
                  </div>

                  {/* Hidden Layer Nodes */}
                  <div className="flex flex-col gap-3 relative z-10">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="flex items-center justify-center">
                        <div className={`w-3.5 h-3.5 rounded-full border border-purple-500/40 bg-purple-950 flex items-center justify-center ${
                          isTraining && n % 2 === 0 ? 'bg-purple-500 flex ring-2 ring-purple-500/20' : ''
                        }`}>
                          <div className="w-1 h-1 bg-white rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Output Node Node */}
                  <div className="flex flex-col justify-center relative z-10">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded-full border border-indigo-500/40 bg-indigo-950 flex items-center justify-center ${
                        isTraining ? 'bg-indigo-500 shadow-md ring-2 ring-indigo-505/20' : ''
                      }`}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                      <span className="text-[8px] font-mono text-emerald-400 font-bold">Prediction (Y)</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Training logs and loss statistics area - Recharts graph */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-text-secondary font-semibold">Biểu đồ tiến độ huấn luyện sai số (Loss & Accuracy):</span>
                  {trainingLossData.length > 0 && (
                    <div className="flex items-center gap-3 font-mono font-bold text-[9.5px]">
                      <span className="text-purple-400">Train Loss: {trainingLossData[trainingLossData.length - 1].trainLoss}</span>
                      <span className="text-sky-400">Val Loss: {trainingLossData[trainingLossData.length - 1].valLoss}</span>
                      <span className="text-emerald-400">Độ chính xác: {trainingLossData[trainingLossData.length - 1].accuracy}%</span>
                    </div>
                  )}
                </div>

                <div className="h-44 bg-slate-950 rounded-xl border border-slate-900 p-2 overflow-hidden">
                  {trainingLossData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={trainingLossData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c084fc" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="epoch" stroke="#475569" fontSize={9} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="trainLoss" stroke="#c084fc" strokeWidth={1.5} fillOpacity={1} fill="url(#colorLoss)" name="Train Loss" />
                        <Area type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={1} fillOpacity={1} fill="url(#colorAcc)" name="Accuracy (%)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-text-tertiary font-bold">
                      <span>* Click "Chạy Training" rực rỡ để vẽ đồ thị hàm suy giảm sai số tự động *</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Confusion matrix mockup */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { label: "True Positives (Bắt trúng gian lận)", val: currentEpoch > 0 ? "89.2% (Khớp cao)" : "N/A", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { label: "False Positives (Bị bắt nhầm)", val: currentEpoch > 0 ? `${Math.max(1.2, 14.5 - (currentEpoch * 0.1)).toFixed(1)}%` : "N/A", color: "text-orange-400 border-orange-500/10 bg-orange-500/5" },
                  { label: "Precision (Tỷ lệ xác chuẩn)", val: currentEpoch > 0 ? `${(85 + (currentEpoch * 0.12)).toFixed(1)}%` : "N/A", color: "text-purple-400 border-purple-500/10 bg-purple-500/5" },
                  { label: "F1 Score (Điểm trung hòa F1)", val: currentEpoch > 0 ? `0.92 (Cực Đỉnh)` : "N/A", color: "text-sky-400 border-sky-500/10 bg-sky-500/5" }
                ].map((conf, index) => (
                  <div key={index} className={`p-2 rounded-lg border text-center ${conf.color}`}>
                    <span className="text-[8px] font-black uppercase text-slate-450 block truncate leading-tight">{conf.label}</span>
                    <p className="text-[11px] font-black mt-1 font-mono">{conf.val}</p>
                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* C. INTUITIVE PYTHON CODE EXPORTER & DEEP MATH EXPLANATIONS */}
          <div className="bg-bg-primary/60 border border-border-primary rounded-3xl p-6 shadow-xl space-y-6">
            
            <div className="grid lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Written explanations in Vietnamese (6 cols) */}
              <div className="lg:col-span-6 bg-slate-950/50 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="border-b border-slate-900 pb-2 flex justify-between items-center bg-[#010408]/30 px-2 py-1 rounded">
                    <span className="text-[10px] font-bold text-text-secondary uppercase font-mono">
                      Kiến Thức Nền Tảng - Trực Quan Toán Học
                    </span>
                    <span className="bg-[#1f0b2f] text-purple-400 text-[9px] font-black px-2 py-0.5 rounded font-mono">
                      COMPUTATION NOTEBOOK
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-text-primary">{activeMLModel.name}</h3>
                    <p className="text-xs text-text-secondary font-bold italic">{activeMLModel.subtitle}</p>
                  </div>

                  <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                    {activeMLModel.archDescription}
                  </p>

                  <div className="p-3.5 bg-purple-950/20 border border-purple-900/30 rounded-xl space-y-1.5 text-center">
                    <span className="text-[9.5px] uppercase font-mono text-purple-400 font-bold block">
                      Công thức toán toán học thu nhỏ (Formula):
                    </span>
                    <div className="bg-slate-950 p-2 rounded border border-slate-900 font-mono text-xs text-slate-200 font-black">
                      {activeMLModel.mathFormula}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9.5px] uppercase font-mono text-text-secondary font-bold block">Ứng dụng thực tế vượt trội:</span>
                    <div className="bg-[#050b12] p-3 rounded-lg border border-slate-850 text-xs text-emerald-400 font-bold">
                      💡 {activeMLModel.useCase}
                    </div>
                  </div>
                </div>

                <div className="bg-[#050b12] p-2.5 rounded-xl border border-slate-850 text-[9.5px] text-text-tertiary leading-normal font-sans italic">
                  * Chú ý: Học sâu về Machine Learning yêu cầu tích hợp giải toán Vector đại số tuyến tính ròng và Giải tích Gradient để tinh chỉnh tối đa mô hình!
                </div>
              </div>

              {/* Code exporter PyTorch panel (6 cols) */}
              <div className="lg:col-span-6 bg-slate-950 rounded-2xl border border-slate-850 p-5 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <span className="text-[10px] uppercase font-mono text-text-secondary font-bold flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-purple-400" />
                      Mã nguồn PyTorch Python tương thích
                    </span>
                    <button
                      onClick={() => handleCopyCode(activeMLModel.pythonSnippet)}
                      className="text-[9.5px] font-black text-purple-400 hover:text-text-primary bg-bg-primary border border-border-primary px-2.5 py-1 rounded transition-all"
                    >
                      {copiedCodeFlag ? 'Đã sao chép' : 'Copy Python Code'}
                    </button>
                  </div>

                  <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                    * Đoạn script Python sử dụng thư viện PyTorch để xây dựng cấu trúc lớp mạng nơ-ron sâu rực rỡ:
                  </p>

                  <pre className="text-[10px] font-mono text-text-secondary overflow-x-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-800 p-3 bg-[#03060c] rounded-xl border border-slate-900 leading-relaxed font-semibold">
                    {activeMLModel.pythonSnippet}
                  </pre>
                </div>

                {/* Subtext info */}
                <div className="flex items-center gap-2 text-[10px] text-text-tertiary bg-[#050a12]/40 border border-slate-850 p-2.5 rounded-xl">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>PyTorch giúp tự động hóa tính đạo hàm riêng (Autograd) phục vụ thuật toán lan truyền ngược 0đ cực đỉnh!</span>
                </div>
              </div>

            </div>

            {/* Neural network model choice grid */}
            <div className="grid grid-cols-3 gap-3 border-t border-slate-850 pt-5">
              {ML_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMLModelId(m.id);
                    resetMLSimulation();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all text-left relative overflow-hidden group ${
                    selectedMLModelId === m.id
                      ? 'bg-purple-500/10 border-purple-500 shadow-md'
                      : 'bg-[#040810]/75 border-slate-850 hover:bg-bg-primary/50'
                  }`}
                >
                  <span className="text-[10px] font-bold text-purple-400 font-mono block">MODEL DESIGNATION</span>
                  <h4 className="text-xs font-black text-slate-100 mt-1">{m.name}</h4>
                  <p className="text-[10px] text-text-secondary line-clamp-2 mt-1 leading-normal font-medium">{m.subtitle}</p>
                </button>
              ))}
            </div>

          </div>
          </div>
          )}

          {mlSubTab === 'lifecycle' && (
            <div className="space-y-6">
              {/* Mindmap or stage progress buttons */}
              <div className="bg-[#040812]/80 border border-slate-850 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <span className="text-[9.5px] font-black text-indigo-400 font-mono block tracking-widest text-[#a5b4fc]">AI/ML PRODUCTION WORKFLOW</span>
                    <h3 className="text-sm font-black uppercase text-slate-100 mt-0.5 flex items-center gap-1.5 font-sans text-text-primary">
                      🔄 Chu trình rèn luyện & Triển khai thực dụng (Edge AI)
                    </h3>
                    <p className="text-xs text-text-secondary font-semibold leading-normal mt-0.5">
                      Click chọn từng cột mốc sản xuất bên dưới để mở rộng kịch bản kỹ thuật lập trình và trực quan hoá giải pháp:
                    </p>
                  </div>
                  <span className="mt-2 sm:mt-0 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9.5px] font-extrabold uppercase font-mono rounded">
                    End-To-End Pipeline
                  </span>
                </div>

                {/* 5 Stages horizontal timeline progress */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 border-b border-slate-850 pb-4">
                  {LIFECYCLE_STAGES.map((stg) => {
                    const isSelStg = selectedLifeStage === stg.id;
                    return (
                      <button
                        key={stg.id}
                        onClick={() => setSelectedLifeStage(stg.id as any)}
                        className={`text-left p-3 rounded-2xl border transition-all h-full flex flex-col justify-between relative overflow-hidden group cursor-pointer ${
                          isSelStg
                            ? 'bg-indigo-500/10 border-indigo-500 shadow'
                            : 'bg-[#03060c] border-slate-850 hover:border-border-primary hover:bg-bg-primary/40'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded font-mono ${
                              isSelStg ? 'bg-indigo-500/25 text-indigo-300' : 'bg-bg-primary text-text-tertiary'
                            }`}>
                              {stg.stepNumber}
                            </span>
                          </div>
                          <h4 className={`text-[11px] font-extrabold leading-tight line-clamp-2 ${
                            isSelStg ? 'text-text-primary' : 'text-slate-350 group-hover:text-slate-100'
                          }`}>
                            {stg.title}
                          </h4>
                        </div>
                        <span className="text-[8.5px] font-bold text-text-tertiary block truncate mt-2 font-mono">
                          {stg.subtitle}
                        </span>
                        {isSelStg && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Detail section of selected stage (2 columns layout) */}
                {(() => {
                  const currentStg = LIFECYCLE_STAGES.find(s => s.id === selectedLifeStage) || LIFECYCLE_STAGES[0];
                  return (
                    <div className="grid lg:grid-cols-12 gap-6 items-stretch pt-2">
                      {/* Visual simulator based on active stage (5 cols) */}
                      <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                        
                        <div className="space-y-4">
                          <div className="border-b border-slate-850 pb-2 bg-[#02050b]/30 px-2 py-1 rounded flex justify-between items-center">
                            <span className="text-[9.5px] font-black uppercase text-[#a5b4fc] font-mono flex items-center gap-1.5 text-indigo-400">
                              <Cpu className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                              Laboratory Visualizer ({currentStg.stepNumber})
                            </span>
                            <span className="text-[8.5px] text-text-tertiary font-bold font-mono">INTERACTIVE</span>
                          </div>

                          <div>
                            <h4 className="text-[12.5px] font-black text-text-primary">{currentStg.title}</h4>
                            <p className="text-[10.5px] text-text-secondary mt-1 font-semibold leading-relaxed">
                              {currentStg.description}
                            </p>
                          </div>

                          {/* Interactive dynamic visual widget depending on stage */}
                          {selectedLifeStage === 'data_prep' && (
                            <div className="p-3.5 bg-indigo-950/10 border border-indigo-900/30 rounded-xl space-y-3">
                              <span className="text-[9.5px] uppercase font-mono font-black block text-indigo-300">
                                🎛️ Giả lập Outlier Scaler (Standard vs Robust):
                              </span>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] items-center">
                                  <span className="text-text-secondary font-medium">Giá trị nạp thẻ đột biến (Cá mập):</span>
                                  <span className="text-indigo-400 font-mono font-bold">{outlierVal.toLocaleString()} VNĐ</span>
                                </div>
                                <input 
                                  type="range"
                                  min="15"
                                  max="100000"
                                  step="100"
                                  value={outlierVal}
                                  onChange={(e) => setOutlierVal(Number(e.target.value))}
                                  className="w-full h-1 bg-bg-primary rounded accent-indigo-500 cursor-pointer"
                                />
                              </div>

                              <p className="text-[9.5px] text-text-secondary italic">
                                * Tập dữ liệu gốc: [10, 12, 11, 15, {outlierVal}]. Hãy xem cách chuẩn hoá giá trị nạp bình thường (ví dụ: 12 VNĐ):
                              </p>

                              <div className="grid grid-cols-2 gap-2 mt-1">
                                {/* Standard Scaler calculate */}
                                {(() => {
                                  const vals = [10, 12, 11, 15, outlierVal];
                                  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
                                  const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
                                  const std = Math.sqrt(variance) || 1;
                                  const normStd = (12 - mean) / std;

                                  return (
                                    <div className="p-2.5 bg-red-950/15 border border-red-900/20 rounded-lg text-center">
                                      <span className="text-[8px] font-bold text-red-400 block uppercase">StandardScaler</span>
                                      <p className="text-xs font-black text-red-400 mt-1">{normStd.toFixed(4)}</p>
                                      <span className="text-[8px] text-text-tertiary font-medium block mt-1">Bị lệch ròng vì cá mập nạp kéo lệch Mean/Std!</span>
                                    </div>
                                  );
                                })()}

                                {/* Robust Scaler calculate */}
                                {(() => {
                                  const sortedVals = [10, 12, 11, 15, outlierVal].sort((a,b)=>a-b);
                                  const q1 = sortedVals[1]; 
                                  const q3 = sortedVals[3]; 
                                  const median = sortedVals[2];
                                  const iqr = (q3 - q1) || 1;
                                  const normRobust = (12 - median) / iqr;

                                  return (
                                    <div className="p-2.5 bg-emerald-950/15 border border-emerald-900/20 rounded-lg text-center">
                                      <span className="text-[8px] font-bold text-emerald-400 block uppercase">RobustScaler</span>
                                      <p className="text-xs font-black text-emerald-400 mt-1">+{normRobust.toFixed(4)}</p>
                                      <span className="text-[8px] text-text-tertiary font-medium block mt-1">Kiên cố tuyệt đối vì Median/IQR ổn định!</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          )}

                          {selectedLifeStage === 'training_tuning' && (
                            <div className="p-3.5 bg-indigo-950/10 border border-indigo-900/30 rounded-xl space-y-3">
                              <span className="text-[9.5px] uppercase font-mono font-black block text-indigo-300">
                                🎛️ Giả lập Đồ thị bảo vệ Overfitting (Dropout Shield):
                              </span>
                              
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-slate-350 block">Dropout Probability:</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {[0, 15, 30, 60].map(dr => (
                                    <button
                                      key={dr}
                                      onClick={() => setDropoutRate(dr)}
                                      className={`py-1 rounded text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                                        dropoutRate === dr
                                          ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400'
                                          : 'bg-[#03060b] border-slate-850 text-text-tertiary'
                                      }`}
                                    >
                                      {dr}%
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Simulated Plot curves */}
                              <div className="h-28 bg-[#02050b] border border-slate-900 rounded-lg relative flex flex-col justify-end p-2 overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.03),transparent_70%)]"></div>
                                
                                <svg className="w-full h-full absolute inset-0 md:block" viewBox="0 0 100 40">
                                  {/* Grid lines */}
                                  <line x1="0" y1="10" x2="100" y2="10" stroke="#111827" strokeWidth="0.5" />
                                  <line x1="0" y1="20" x2="100" y2="20" stroke="#111827" strokeWidth="0.5" />
                                  <line x1="0" y1="30" x2="100" y2="30" stroke="#111827" strokeWidth="0.5" />

                                  {/* Train Loss line: always stable decline */}
                                  <path d="M 5,5 Q 35,33 95,36" fill="none" stroke="#a78bfa" strokeWidth="1" strokeDasharray="1 1" />
                                  
                                  {/* Val Loss line: dynamic depending on Dropout */}
                                  {dropoutRate === 0 && (
                                    <path d="M 5,6 Q 30,22 55,18 T 95,5" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                                  )}
                                  {dropoutRate === 15 && (
                                    <path d="M 5,6 Q 30,25 60,28 T 95,20" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                                  )}
                                  {dropoutRate === 30 && (
                                    <path d="M 5,6 Q 30,28 65,33 T 95,34" fill="none" stroke="#10b981" strokeWidth="1.5" />
                                  )}
                                  {dropoutRate === 60 && (
                                    <path d="M 5,12 Q 35,22 70,25 T 95,26" fill="none" stroke="#6b7280" strokeWidth="1.5" />
                                  )}
                                </svg>

                                {/* Graph labels */}
                                <div className="flex justify-between w-full text-[7.5px] font-mono text-slate-600 self-end z-10 relative">
                                  <span>Cực trị Epoch 1 (Đầu)</span>
                                  <span>Cực Khớp Epoch 30 (Cuối)</span>
                                </div>

                                <div className="absolute top-2 left-2 z-10 flex gap-2 text-[7.5px] font-mono">
                                  <span className="flex items-center gap-1 text-purple-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Train Loss
                                  </span>
                                  <span className={`flex items-center gap-1 ${
                                    dropoutRate === 0 ? 'text-red-400' : dropoutRate === 15 ? 'text-amber-400' : dropoutRate === 30 ? 'text-emerald-400' : 'text-text-secondary'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      dropoutRate === 0 ? 'bg-red-500' : dropoutRate === 15 ? 'bg-amber-500' : dropoutRate === 30 ? 'bg-emerald-500' : 'bg-slate-500'
                                    }`}></span> 
                                    Val Loss ({dropoutRate === 0 ? 'Overfit' : dropoutRate === 15 ? 'Ấm nhẹ' : dropoutRate === 30 ? 'Chuẩn' : 'Underfit'})
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedLifeStage === 'convert_quantize' && (
                            <div className="p-3.5 bg-indigo-950/10 border border-indigo-900/30 rounded-xl space-y-3">
                              <span className="text-[9.5px] uppercase font-mono font-black block text-indigo-300">
                                🎛️ Giả lập nén mô hình lượng tử hoá Precision:
                              </span>
                              
                              <div className="space-y-4">
                                {/* Precision Chooser */}
                                <div className="space-y-1">
                                  <span className="text-[9px] text-text-secondary font-bold block">Kiểu lưu trữ Trọng số (Weights Type):</span>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {(['fp32', 'fp16', 'int8'] as const).map(pr => (
                                      <button
                                        key={pr}
                                        onClick={() => setQuantLevel(pr)}
                                        className={`py-1 text-[10px] font-mono font-bold rounded border transition-all cursor-pointer ${
                                          quantLevel === pr
                                            ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400'
                                            : 'bg-[#03060b] border-slate-850 text-text-tertiary'
                                        }`}
                                      >
                                        {pr.toUpperCase()} {pr === 'fp32' ? '(Gốc)' : pr === 'fp16' ? '(Semi)' : '(Lượng tử)'}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Calibration Selector if INT8 */}
                                {quantLevel === 'int8' && (
                                  <div className="space-y-1">
                                    <span className="text-[9px] text-text-secondary font-bold block">Thuật toán Calibration dải động (INT8):</span>
                                    <div className="grid grid-cols-3 gap-1.5">
                                      {(['minmax', 'entropy', 'percentile'] as const).map(c => (
                                        <button
                                          key={c}
                                          onClick={() => setQuantCalib(c)}
                                          className={`py-1 text-[9px] font-mono rounded border transition-all cursor-pointer ${
                                            quantCalib === c
                                              ? 'bg-purple-500/15 border-purple-500 text-purple-400'
                                              : 'bg-[#03060b] border-[#1e293b] text-text-tertiary'
                                          }`}
                                        >
                                          {c === 'minmax' ? 'MinMax' : c === 'entropy' ? 'Entropy (KL)' : 'Percentile'}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Simulated Quant metrics outcome */}
                              {(() => {
                                let size = 250; 
                                let latency = 68; 
                                let battery = "😰 Tốn pin, rất nóng máy";
                                let batteryCol = "text-red-400";
                                let accuracy = 98.4;

                                if (quantLevel === 'fp16') {
                                  size = 125;
                                  latency = 28;
                                  battery = "😐 Ấm tay, hao pin vừa";
                                  batteryCol = "text-amber-400";
                                  accuracy = 98.3;
                                } else if (quantLevel === 'int8') {
                                  size = 7.8;
                                  latency = 3.5;
                                  battery = "🔋 Thong thả, siêu mát máy";
                                  batteryCol = "text-emerald-400";
                                  
                                  if (quantCalib === 'minmax') accuracy = 96.2;
                                  else if (quantCalib === 'entropy') accuracy = 98.1; 
                                  else accuracy = 97.7;
                                }

                                return (
                                  <div className="p-3 bg-bg-primary rounded-xl border border-slate-850 space-y-2">
                                    <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                                      <div>
                                        <span className="text-text-tertiary font-medium">Dung lượng tệp (.onnx):</span>
                                        <p className="font-mono text-xs font-black text-slate-200">{size.toFixed(1)} MB</p>
                                      </div>
                                      <div>
                                        <span className="text-text-tertiary font-semibold font-medium">Tốc độ suy luận Mobile:</span>
                                        <p className="font-mono text-xs font-black text-slate-200">~ {latency.toFixed(1)} ms / lượt</p>
                                      </div>
                                      <div>
                                        <span className="text-text-tertiary font-medium">Độ chính xác kiểm định:</span>
                                        <p className="font-mono text-xs font-black text-indigo-400">{accuracy.toFixed(1)}%</p>
                                      </div>
                                      <div>
                                        <span className="text-text-tertiary font-medium">Tải nhiệt & Hao pin:</span>
                                        <p className={`font-mono text-[9px] font-black ${batteryCol}`}>{battery}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {selectedLifeStage === 'deploy_edge' && (
                            <div className="p-3.5 bg-indigo-950/10 border border-indigo-900/30 rounded-xl space-y-3">
                              <span className="text-[9.5px] uppercase font-mono font-black block text-indigo-300">
                                🎛️ Giả lập Chi phí & Network Latency (Cloud API vs Local Edge):
                              </span>

                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] items-center">
                                  <span className="text-text-secondary font-medium">Số Người Chơi hằng ngày (DAU):</span>
                                  <span className="text-[#818cf8] font-mono font-bold">{dailyDau.toLocaleString()} DAU</span>
                                </div>
                                <input 
                                  type="range"
                                  min="1000"
                                  max="100000"
                                  step="1000"
                                  value={dailyDau}
                                  onChange={(e) => setDailyDau(Number(e.target.value))}
                                  className="w-full h-1 bg-bg-primary rounded accent-indigo-500 cursor-pointer"
                                />
                              </div>

                              {/* Network vs Edge cost structure comparison */}
                              {(() => {
                                const cloudInferencesMonth = dailyDau * 30 * 30; 
                                const cloudCostUsd = (cloudInferencesMonth / 1000000) * 4.5; 

                                return (
                                  <div className="space-y-2 pt-1 font-sans text-[10px]">
                                    {/* Cloud row */}
                                    <div className="p-2.5 bg-red-950/10 border border-red-900/15 rounded-lg flex justify-between items-center bg-red-950/5">
                                      <div>
                                        <span className="text-[8px] uppercase font-bold text-red-400 block leading-none text-left">Cloud API Server Inference</span>
                                        <span className="text-[8px] text-text-tertiary font-semibold block mt-1 text-left">Gửi dữ liệu qua API lên Host Server</span>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="font-mono text-red-400 font-black">~ {cloudCostUsd.toLocaleString('en-US', {maximumFractionDigits: 0})} USD / Tháng</p>
                                        <p className="text-[9px] text-text-tertiary font-semibold font-mono">Đồ trễ lag ~250ms</p>
                                      </div>
                                    </div>

                                    {/* Local Edge row */}
                                    <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/20 rounded-lg flex justify-between items-center">
                                      <div>
                                        <span className="text-[8px] uppercase font-bold text-emerald-400 block leading-none text-left">On-device local Edge (ONNX)</span>
                                        <span className="text-[8px] text-text-tertiary font-semibold block mt-1 text-left">Hệ tính trực tiếp trên cục bộ Web/Mobile GPU</span>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="font-mono text-emerald-400 font-black">0đ Vĩnh Viễn!</p>
                                        <p className="text-[9px] text-emerald-500 font-semibold font-mono">Đồ trễ cực thấp ~3ms</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {selectedLifeStage === 'ab_test' && (
                            <div className="p-3.5 bg-indigo-950/10 border border-indigo-900/30 rounded-xl space-y-3">
                              <span className="text-[9.5px] uppercase font-mono font-black block text-indigo-300">
                                🎛️ Giả lập Trượt bối cảnh Data Drift (Concept Drift):
                              </span>

                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] items-center">
                                  <span className="text-text-secondary font-medium">Mức độ trượt dữ liệu (Drift Rate):</span>
                                  <span className={`${driftFactor > 35 ? 'text-red-400' : 'text-indigo-400'} font-mono font-bold`}>{driftFactor}%</span>
                                </div>
                                <input 
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={driftFactor}
                                  onChange={(e) => setDriftFactor(Number(e.target.value))}
                                  className="w-full h-1 bg-bg-primary rounded accent-indigo-500 cursor-pointer"
                                />
                              </div>

                              {(() => {
                                const currAcc = Math.max(58, 98.4 - (driftFactor * 0.38));
                                const isAlert = driftFactor > 30;

                                return (
                                  <div className="space-y-2">
                                    <div className="p-2.5 bg-bg-primary rounded-xl border border-slate-850 flex justify-between items-center font-mono">
                                      <span className="text-[9px] text-text-secondary">Độ chính xác hiện hành:</span>
                                      <span className={`text-xs font-black ${isAlert ? 'text-rose-450' : 'text-emerald-400'}`}>{currAcc.toFixed(1)}% {isAlert ? '⚠️ DRIFTED!' : '✅ OK'}</span>
                                    </div>

                                    {isAlert ? (
                                      <div className="p-2.5 bg-rose-950/15 border border-rose-900/30 rounded-lg text-center font-sans space-y-1.5">
                                        <p className="text-[9px] text-rose-300 font-black uppercase">🚨 Cảnh báo hệ thống: Mô hình bị suy giảm thông thái!</p>
                                        <button 
                                          onClick={() => setDriftFactor(0)}
                                          className="bg-rose-600 hover:bg-rose-500 text-text-primary font-black text-[9px] py-1 px-3 rounded uppercase tracking-wider transition-all cursor-pointer"
                                        >
                                          Dỡ bỏ & Kích Hoạt Re-Train 🔄
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-[9px] text-text-tertiary italic text-center font-sans">
                                        * Hãy kéo thanh Drift Rate lên trên 30% để xem cảnh báo của hệ thống A/B Testing!
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Advantages label */}
                          <div className="p-3 bg-indigo-950/20 border border-indigo-900/25 rounded-xl space-y-1 text-left">
                            <span className="text-[9.5px] uppercase font-mono text-[#a5b4fc] font-bold block">
                              🎯 Lợi điểm thực dụng mang lại:
                            </span>
                            <p className="text-[10.5px] text-text-secondary leading-relaxed font-semibold">
                              {currentStg.advantages}
                            </p>
                          </div>
                        </div>

                        {/* Stack advice */}
                        <div className="pt-3 border-t border-slate-900 text-[9.5px] text-text-tertiary font-semibold leading-relaxed text-left">
                          <span className="uppercase text-[8.5px] text-text-secondary font-bold block mb-1">CÔNG CỤ KHUYÊN DÙNG (STACK ADVICE):</span>
                          <span>{currentStg.recommends}</span>
                        </div>
                      </div>

                      {/* Code block view and copy (7 cols) */}
                      <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-850 p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                            <span className="text-[9.5px] uppercase font-mono text-text-secondary font-bold flex items-center gap-1.5">
                              <FileCode className="w-4 h-4 text-indigo-400 animate-pulse" />
                              Mã lập trình sản xuất thực tiễn {currentStg.codeLanguage.toUpperCase()}
                            </span>
                            <button
                              onClick={() => handleCopyCode(currentStg.code)}
                              className="text-[9px] font-black text-indigo-400 hover:text-text-primary bg-bg-primary border border-border-primary px-2 py-1 rounded transition-all flex items-center gap-1 cursor-pointer"
                            >
                              {copiedCodeFlag ? 'Đã sao chép' : 'Copy Code'}
                            </button>
                          </div>

                          <p className="text-[10px] text-text-secondary leading-normal font-semibold text-left">
                            * Bản mẫu code đặc tả đúng chuẩn công nghiệp, cho phép kéo nhập trực tiếp vào dự án thực để vận hành:
                          </p>

                          <pre className="text-[9.5px] font-mono text-text-secondary overflow-x-auto max-h-[350px] scrollbar-thin scrollbar-thumb-slate-800 p-3.5 bg-[#03060c] rounded-xl border border-slate-900 leading-relaxed font-semibold text-left">
                            {currentStg.code}
                          </pre>
                        </div>

                        <div className="bg-[#050a12]/80 p-2.5 rounded-xl border border-slate-850 text-[9px] text-text-tertiary leading-relaxed font-sans italic text-left">
                          * Chú ý: Việc biên dịch mã nguồn {currentStg.codeLanguage.toUpperCase()} đòi hỏi cấu hình đúng thư viện môi trường để chạy mượt!
                        </div>
                      </div>

                    </div>
                  );
                })()}

              </div>
            </div>
          )}

          {mlSubTab === 'beginner' && (
            <div className="space-y-6">
              {/* Card 1: Interactive Confusion Matrix Sandbox */}
              <div className="bg-[#040812]/80 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[9.5px] font-black text-rose-450 font-mono block tracking-widest text-[#fb7185]">ML PERFORMANCE METRICS PLAYGROUND</span>
                    <h3 className="text-sm font-black uppercase text-slate-100 mt-0.5 flex items-center gap-1.5 text-text-primary">
                      🎯 Lab 1: Interactive Confusion Matrix (Ma Trận Nhầm Lẫn)
                    </h3>
                    <p className="text-xs text-text-secondary font-semibold leading-relaxed mt-0.5">
                      Một lỗi phổ biến của người mới bắt đầu (Beginner) là dựa dẫm hoàn toàn vào <strong>Accuracy (Độ chính xác)</strong> khi tập dữ liệu bị lệch (imbalanced). Hãy đóng vai một kỹ sư chống hack trong game để ngộ ra sự đánh đổi đau đớn giữa <strong>Precision (Độ chuẩn xác)</strong> và <strong>Recall (Độ phủ)</strong>!
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9.5px] font-extrabold uppercase font-mono rounded-lg">
                    Phần Học Cực Kỳ Trực Quan
                  </span>
                </div>

                {/* Scenario details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-bg-primary/40 p-4 rounded-2xl border border-slate-850/60">
                  <div className="text-center md:text-left">
                    <span className="text-[10px] text-text-tertiary font-mono block uppercase">TỔNG SỐ NGƯỜI CHƠI (TOTAL)</span>
                    <span className="text-xl font-black text-text-primary font-mono">100</span>
                  </div>
                  <div className="text-center md:text-left border-t md:border-t-0 md:border-l border-slate-850/80 md:pl-4">
                    <span className="text-[10px] text-text-tertiary font-mono block uppercase">SỐ HACKER THỰC SỰ (ACTUAL POSITIVE)</span>
                    <span className="text-xl font-black text-rose-450 font-mono">30</span>
                  </div>
                  <div className="text-center md:text-left border-t md:border-t-0 md:border-l border-slate-850/80 md:pl-4">
                    <span className="text-[10px] text-text-tertiary font-mono block uppercase">NGƯỜI CHƠI TỐT THỰC SỰ (ACTUAL NEGATIVE)</span>
                    <span className="text-xl font-black text-indigo-400 font-mono">70</span>
                  </div>
                  <div className="text-center md:text-left border-t md:border-t-0 md:border-l border-slate-850/80 md:pl-4">
                    <span className="text-[10px] text-text-tertiary font-mono block uppercase">YÊU CẦU THỰC CHIẾN</span>
                    <span className="text-xs font-bold text-text-secondary block mt-1 leading-tight text-left">Phân loại & khóa tài khoản Hacker, không khóa nhầm người vô tội!</span>
                  </div>
                </div>

                {/* SLIDER FOR DECISION THRESHOLD */}
                <div className="p-5 bg-[#03060c] border border-slate-850/80 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="text-left">
                      <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide">
                        🎛️ Thay đổi Ngưỡng Tin Cậy Phân Loại (Confidence Decision Threshold)
                      </h4>
                      <p className="text-[10.5px] text-text-secondary font-semibold mt-0.5">
                        Kéo thanh trượt để chỉnh độ nhạy bén của hệ thống chống hack AI:
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[9.5px] text-text-tertiary font-mono block uppercase leading-none">AI THRESHOLD</span>
                      <span className="text-xl font-mono font-black text-rose-400">&gt;= {(metricsThreshold * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0.01"
                    max="0.99"
                    step="0.01"
                    value={metricsThreshold}
                    onChange={(e) => setMetricsThreshold(Number(e.target.value))}
                    className="w-full h-1.5 bg-bg-primary rounded-lg accent-rose-500 cursor-pointer"
                  />

                  <div className="flex justify-between text-[9px] font-mono text-text-tertiary">
                    <span className="text-left font-bold text-[#fecdd3]">1% (Quá Đa Nghi - Nghi ai là ban người đó!)</span>
                    <span className="text-right font-bold text-[#fecdd3]">99% (Quá Thần Trọng - Chỉ ban khi chắc chắn 100%!)</span>
                  </div>
                </div>

                {/* 2 columns layout: confusion matrix vs metrics outcomes */}
                <div className="grid lg:grid-cols-12 gap-5 items-stretch">
                  
                  {/* Confusion Matrix Display (5 cols) */}
                  <div className="lg:col-span-6 bg-[#03060c]/60 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[11.5px] font-black text-text-secondary uppercase tracking-widest font-mono mb-4 text-center">
                        📊 MA TRẬN NHẦM LẪN THỰC TẾ (CONFUSION MATRIX GRID)
                      </h4>
                      
                      {/* Grid structure */}
                      <div className="grid grid-cols-12 gap-2 text-center text-[10px]">
                        {/* Headers */}
                        <div className="col-span-3"></div>
                        <div className="col-span-9 grid grid-cols-2 bg-bg-primary/30 py-1.5 rounded-lg border border-slate-900 font-mono font-bold text-text-secondary">
                          <div>Đoán là HACKER (Pred +)</div>
                          <div>Thả TỰ DO (Pred -)</div>
                        </div>

                        {/* Row 1: Actual Hacker */}
                        <div className="col-span-3 bg-red-950/20 border border-red-900/10 p-2.5 rounded-lg font-mono font-black text-red-400 flex flex-col justify-center text-left leading-tight">
                          <span className="text-[8px] text-text-tertiary block">Thực tế</span>
                          HACKER
                        </div>
                        {/* Cell 1: TP */}
                        <div className="col-span-4 bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl flex flex-col justify-center items-center shadow shadow-emerald-950/5 relative group transition-all hover:bg-emerald-950/30">
                          <span className="text-[8.5px] text-emerald-400 font-black uppercase font-mono">True Positive (TP)</span>
                          <span className="text-2xl font-mono font-black text-emerald-400 mt-1">{tp}</span>
                          <span className="text-[8px] text-text-secondary font-semibold leading-tight mt-1">Bắt đúng Hacker</span>
                        </div>
                        {/* Cell 2: FN */}
                        <div className="col-span-5 bg-amber-950/15 border border-amber-500/20 p-3 rounded-xl flex flex-col justify-center items-center relative group transition-all hover:bg-amber-950/20">
                          <span className="text-[8.5px] text-amber-400 font-black uppercase font-mono">False Negative (FN)</span>
                          <span className="text-2xl font-mono font-black text-amber-450 mt-1">{fn}</span>
                          <span className="text-[8px] text-text-secondary font-semibold leading-tight mt-1 text-center">Bỏ sót Hacker (Lọt lưới)</span>
                        </div>

                        {/* Row 2: Actual Clean */}
                        <div className="col-span-3 bg-indigo-950/10 border border-indigo-900/10 p-2.5 rounded-lg font-mono font-black text-indigo-400 flex flex-col justify-center text-left leading-tight">
                          <span className="text-[8px] text-text-tertiary block">Thực tế</span>
                          BÌNH THƯỜNG
                        </div>
                        {/* Cell 3: FP */}
                        <div className="col-span-4 bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl flex flex-col justify-center items-center shadow shadow-rose-950/5 relative group transition-all hover:bg-rose-950/30">
                          <span className="text-[8.5px] text-rose-450 font-black uppercase font-mono">False Positive (FP)</span>
                          <span className="text-2xl font-mono font-black text-rose-400 mt-1">{fp}</span>
                          <span className="text-[8px] text-text-secondary font-semibold leading-tight mt-1 text-center font-bold">Oan sai! (Phạt nhầm tốt)</span>
                        </div>
                        {/* Cell 4: TN */}
                        <div className="col-span-5 bg-bg-primary/50 border border-border-primary p-3 rounded-xl flex flex-col justify-center items-center transition-all hover:bg-bg-primary">
                          <span className="text-[8.5px] text-slate-550 font-black uppercase font-mono">True Negative (TN)</span>
                          <span className="text-2xl font-mono font-black text-slate-350 mt-1">{tn}</span>
                          <span className="text-[8px] text-text-secondary font-semibold leading-tight mt-1">Thả đúng người vô tội</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-bg-primary/40 rounded-xl border border-slate-900 text-[10px] text-text-secondary leading-normal text-left shadow">
                      💡 <strong>Ý nghĩa của 4 ô:</strong> 100 người chơi được nạp vào. Hàng hiển thị hành vi thực của người chơi, Cột hiển thị AI của bạn phán quyết. Hãy để ý tổng của 4 ô luôn luôn bằng 100!
                    </div>
                  </div>

                  {/* Calculations & Interpretations (7 cols) */}
                  <div className="lg:col-span-6 bg-[#03060c] border border-slate-850 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="text-[11.5px] font-black text-text-secondary uppercase tracking-widest font-mono mb-3 text-left">
                        📉 CHỈ SỐ THÔNG THỦY (ML PERFORMANCE METRICS)
                      </h4>

                      {/* 4 Metric grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* ACCURACY */}
                        <div className="p-3 bg-bg-primary/60 rounded-xl border border-slate-850 text-left">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-text-secondary">1. Accuracy (Chính xác tổng)</span>
                            <span className="text-[8px] text-text-tertiary font-mono">TP+TN/Total</span>
                          </div>
                          <p className="text-lg font-mono font-black text-slate-100 mt-1">{(accVal * 100).toFixed(1)}%</p>
                          <span className="text-[9px] text-slate-450 block leading-tight mt-1 font-semibold text-text-secondary">Tỷ số đoán trúng trên toàn bộ 100 người.</span>
                        </div>

                        {/* F1 SCORE */}
                        <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-left shadow-sm shadow-indigo-950/20">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-indigo-300 animate-pulse">2. F1-Score (Hòa hợp)</span>
                            <span className="text-[8px] text-indigo-500 font-mono">2*(P*R)/(P+R)</span>
                          </div>
                          <p className="text-lg font-mono font-black text-indigo-300 mt-1">{(f1Val * 100).toFixed(1)}%</p>
                          <span className="text-[9px] text-indigo-300 block leading-tight mt-1 font-semibold">Cực kỳ lý tưởng để đo đạc chất lượng tổng quát thực tế.</span>
                        </div>

                        {/* PRECISION */}
                        <div className="p-3 bg-emerald-950/10 border border-emerald-900/25 rounded-xl text-left">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-emerald-400">3. Precision (Bắt đúng)</span>
                            <span className="text-[8px] text-emerald-500 font-mono">TP / (TP+FP)</span>
                          </div>
                          <p className="text-lg font-mono font-black text-emerald-400 mt-1">{(precVal * 100).toFixed(1)}%</p>
                          <span className="text-[9px] text-emerald-450 block leading-tight mt-1 font-semibold text-text-secondary">Khi AI bảo ai đó là hacker, xác xuất đúng là bấy nhiêu %.</span>
                        </div>

                        {/* RECALL */}
                        <div className="p-3 bg-amber-950/10 border border-amber-900/25 rounded-xl text-left">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-amber-400">4. Recall (Độ phủ)</span>
                            <span className="text-[8px] text-amber-500 font-mono">TP / (TP+FN)</span>
                          </div>
                          <p className="text-lg font-mono font-black text-amber-400 mt-1">{(recVal * 100).toFixed(1)}%</p>
                          <span className="text-[9px] text-amber-450 block leading-tight mt-1 font-semibold text-text-secondary">Hệ thống tóm gọn được bao nhiêu % trong số 30 hacker.</span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic feedback advisory */}
                    <div className="p-4 rounded-xl border leading-relaxed bg-[#02050b] text-left text-[10.5px]">
                      {metricsThreshold < 0.35 && (
                        <div className="space-y-1">
                          <span className="text-rose-400 font-black uppercase text-[10px] tracking-wide block font-mono">⚠️ HẬU QUẢ: AI QUÁ NGHI NGẠI (THRESHOLD THẤP)</span>
                          <p className="text-slate-350 font-semibold leading-relaxed">
                            Hệ thống AI xử lý quá gắt gao! Đạt điểm <strong>Recall {(recVal * 100).toFixed(0)}%</strong> tuyệt đỉnh (hacker hầu như bị tóm sạch). Nhưng bạn đã phạm phải tận <strong>{fp} vụ Oan Sai (False Positives)</strong>. Nhiều game thủ chân chính bị ban oan sẽ phẫn nộ, làm khủng hoảng truyền thông sập Studio!
                          </p>
                        </div>
                      )}
                      {metricsThreshold >= 0.35 && metricsThreshold <= 0.65 && (
                        <div className="space-y-1">
                          <span className="text-emerald-400 font-black uppercase text-[10px] tracking-wide block font-mono">✅ TRẠNG THÁI: TỐI ƯU CÂN BẰNG PHÂN PHỐI</span>
                          <p className="text-slate-350 font-semibold leading-relaxed">
                            Ngưỡng cân bằng tuyệt hảo! Bạn tóm gọn được <strong>{tp}/30 hacker</strong>, đồng thời khống chế được oan sai ở mức cực thấp chỉ <strong>{fp} người chơi bị nhầm</strong>. Chỉ số F1-Score đạt đỉnh tương đối. Đây chính là cách làm AI sáng suốt của kỹ sư lão luyện!
                          </p>
                        </div>
                      )}
                      {metricsThreshold > 0.65 && (
                        <div className="space-y-1">
                          <span className="text-amber-400 font-black uppercase text-[10px] tracking-wide block font-mono">⚠️ HẬU QUẢ: AI QUÁ THỜ Ơ (THRESHOLD QUÁ CAO)</span>
                          <p className="text-slate-350 font-semibold leading-relaxed">
                            Mô hình của bạn cực kỳ dè dặt. <strong>Precision {(precVal * 100).toFixed(0)}%</strong> cực cao (chắc chắn mới phạt, không sợ nhầm), nhưng bạn để lọt tận <strong>{fn} Hacker tinh quái (False Negatives)</strong> tự do hack game. Các phòng game sẽ đầy rẫy bất công làm người dùng bỏ game sạch!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 2: Interactive ML Taxonomy Map */}
              <div className="bg-[#040812]/80 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="text-left">
                  <span className="text-[9.5px] font-black text-indigo-400 font-mono block tracking-widest text-[#a5b4fc]">CORE ML TAXONOMY MAP</span>
                  <h3 className="text-sm font-black uppercase text-slate-100 mt-0.5 flex items-center gap-1.5 text-text-primary">
                    🧩 Lab 2: Bản đồ các trường phái học máy cốt lõi (ML Paradigms)
                  </h3>
                  <p className="text-xs text-text-secondary font-semibold leading-normal mt-0.5">
                    Click từng thẻ bên dưới để phân biệt rõ 3 tư duy thuật toán lớn trong giới trí tuệ nhân tạo:
                  </p>
                </div>

                {/* Grid taxonomy selectors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Supervised */}
                  <button 
                    onClick={() => setSelectedTaxonomy('supervised')}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      selectedTaxonomy === 'supervised'
                        ? 'bg-purple-500/10 border-purple-500 shadow-md ring-1 ring-purple-500/25'
                        : 'bg-[#03060c] border-slate-850 hover:bg-bg-primary/40'
                    }`}
                  >
                    <span className="text-[8px] font-bold text-purple-400 font-mono block uppercase">PARADIGM A</span>
                    <h4 className="text-xs font-black text-text-primary mt-1">1. Học Có Giám Sát (Supervised)</h4>
                    <span className="text-[10px] text-text-secondary font-semibold block leading-tight mt-1.5">
                      Dạy AI bằng cặp dữ liệu mẫu (Input - Label). AI so khớp tìm đường nối quy luật.
                    </span>
                  </button>

                  {/* Unsupervised */}
                  <button 
                    onClick={() => setSelectedTaxonomy('unsupervised')}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      selectedTaxonomy === 'unsupervised'
                        ? 'bg-indigo-500/10 border-indigo-500 shadow-md ring-1 ring-indigo-500/25'
                        : 'bg-[#03060c] border-slate-850 hover:bg-bg-primary/40'
                    }`}
                  >
                    <span className="text-[8px] font-bold text-indigo-400 font-mono block uppercase">PARADIGM B</span>
                    <h4 className="text-xs font-black text-text-primary mt-1">2. Học Không Giám Sát (Unsupervised)</h4>
                    <span className="text-[10px] text-text-secondary font-semibold block leading-tight mt-1.5">
                      Chỉ nạp dữ liệu thô không có nhãn. AI tự tìm xu thế, cấu trúc & quy luật ẩn của dữ liệu.
                    </span>
                  </button>

                  {/* Reinforcement */}
                  <button 
                    onClick={() => setSelectedTaxonomy('reinforcement')}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      selectedTaxonomy === 'reinforcement'
                        ? 'bg-rose-500/10 border-rose-500 shadow-md ring-1 ring-rose-500/25'
                        : 'bg-[#03060c] border-slate-850 hover:bg-bg-primary/40'
                    }`}
                  >
                    <span className="text-[8px] font-bold text-rose-400 font-mono block uppercase">PARADIGM C</span>
                    <h4 className="text-xs font-black text-text-primary mt-1">3. Học Tăng Cường (Reinforcement)</h4>
                    <span className="text-[10px] text-text-secondary font-semibold block leading-tight mt-1.5">
                      AI hoạt động như sinh vật sinh học: Đốt thử, sai, hành động nhận thưởng/phạt từ môi trường ảo.
                    </span>
                  </button>
                </div>

                {/* Active Taxonomy details render */}
                <div className="p-5 bg-[#03060c] border border-slate-850/80 rounded-2xl text-left space-y-4">
                  {selectedTaxonomy === 'supervised' && (
                    <div className="grid md:grid-cols-2 gap-5 text-sans text-[11px] leading-relaxed">
                      <div className="space-y-2 border-r border-slate-900 pr-5">
                        <span className="text-purple-400 font-black uppercase text-[10px] block font-mono">Dạng 1: Phân Loại (Classification)</span>
                        <p className="text-slate-350 font-semibold">
                          Chia dữ liệu thành các nhóm ranh giới riêng biệt hoặc xác suất lớp cụ thể.
                          <br /><br />
                          <strong className="text-slate-100">Ví dụ thực tế:</strong> AI duyệt thư rác (Spam vs Inbox), nhận diện khuôn mặt mở khóa điện thoại, hay phân biệt ảnh chó với mèo.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-purple-400 font-black uppercase text-[10px] block font-mono">Dạng 2: Hồi Quy (Regression)</span>
                        <p className="text-slate-350 font-semibold">
                          Dự báo một giá trị số liên tục, không có khoảng cách cụ thể.
                          <br /><br />
                          <strong className="text-slate-100">Ví dụ thực tế:</strong> Dự báo nhiệt độ ngày mai, độ lớn doanh thu năm tới của công ty hay giá vàng dựa trên các chỉ số vĩ mô.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedTaxonomy === 'unsupervised' && (
                    <div className="grid md:grid-cols-2 gap-5 text-sans text-[11px] leading-relaxed">
                      <div className="space-y-2 border-r border-slate-900 pr-5">
                        <span className="text-indigo-400 font-black uppercase text-[10px] block font-mono">Dạng 1: Phân Cụm (Clustering)</span>
                        <p className="text-slate-350 font-semibold">
                          Tự động nhóm những tệp người chơi có hành vi tương đồng thành những cụm riêng biệt để Studio dễ nghiên cứu cá nhân hoá dịch vụ.
                          <br /><br />
                          <strong className="text-slate-100">Ví dụ thực tế:</strong> Thuật toán K-Means phân khúc khách hàng VIP, khách hàng sắp rời bỏ (Churn) để tung quảng cáo tặng code hồi sinh cực kỳ khôn ngoan.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-indigo-400 font-black uppercase text-[10px] block font-mono">Dạng 2: Giảm Chiều Dữ Liệu (Dimensionality Reduction)</span>
                        <p className="text-slate-350 font-semibold">
                          Nén hàng nghìn/triệu thuộc tính dữ liệu (cột) cồng kềnh trở về biểu mẫu nén đơn giản mà ít suy hao thông tin.
                          <br /><br />
                          <strong className="text-slate-100">Ví dụ thực tế:</strong> Thuật toán PCA nén kho ảnh nén véc-tơ cao chiều, hay vẽ bản đồ t-SNE 2D để kỹ sư dễ nhìn thấu dữ liệu 100 chiều.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedTaxonomy === 'reinforcement' && (
                    <div className="grid md:grid-cols-2 gap-5 text-sans text-[11px] leading-relaxed">
                      <div className="space-y-2 border-r border-slate-900 pr-5">
                        <span className="text-rose-400 font-black uppercase text-[10px] block font-mono">Cơ chế cốt lõi (Agent & Environment)</span>
                        <p className="text-slate-350 font-semibold">
                          Không cần người chỉ tay năm ngón bảo phải đi thế nào. Đặt một Agent (AI) vào thế giới ảo, gán cơ chế thưởng phạt thông qua Hàm Thưởng (Reward Function). AI chạy thử, ngã, sửa hàng triệu lần để chọn ra chuỗi quyết định mang lại điểm số cao nhất.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-rose-400 font-black uppercase text-[10px] block font-mono">Ứng dụng thực tế</span>
                        <p className="text-slate-350 font-semibold">
                          <strong className="text-slate-100">Ví dụ thực tế:</strong> Xe tự lái Tesla tự căn đường, AI AlphaGo của Google đánh bại kỳ thủ cờ thế giới Lee Sedol, hay huấn luyện siêu bot khôn ngoan tự chơi game đấu tướng đối kháng.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: 5 Golden Practical Rules for ML Beginners */}
              <div className="bg-[#040812]/80 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <span className="text-[9.5px] font-black text-emerald-450 font-mono block tracking-widest text-emerald-450 text-emerald-400">GOLDEN REAL-WORLD RULES</span>
                    <h3 className="text-sm font-black uppercase text-slate-100 mt-0.5 flex items-center gap-1.5 text-text-primary">
                      💡 5 Nguyên tắc vàng thấu xương của giới kỹ sư AI lão luyện
                    </h3>
                    <p className="text-xs text-text-secondary font-semibold leading-none mt-0.5">
                      Dưới đây là 5 kinh nghiệm thực chiến giúp bạn đỡ trả giá bằng hàng trăm giờ tìm lỗi vô vô ích:
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                  {/* Rule 1 */}
                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-1.5 hover:border-border-primary transition-all flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-extrabold text-purple-400 font-mono block uppercase">RULE 1: ĐỪNG HỌC TỦ (NO GENERAL)</span>
                      <h4 className="text-xs font-black text-slate-200">Không bao giờ Test trên tập huấn luyện!</h4>
                      <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                        Nếu dùng đề thi học kỳ (Test Set) trùng khớp với tài liệu ôn tập (Train Set), mô hình sẽ chỉ nhớ máy móc (Overfitting) mà không học được khả năng tư duy tổng quat. Luôn phân chia tỷ lệ <strong>Train-Test rõ ràng</strong>!
                      </p>
                    </div>
                  </div>

                  {/* Rule 2 */}
                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-1.5 hover:border-border-primary transition-all flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-extrabold text-[#f59e0b] font-mono block uppercase text-amber-500">RULE 2: JUNK IN, JUNK OUT (QUY TẮC RÁC)</span>
                      <h4 className="text-xs font-black text-slate-200">Dữ liệu chất lượng là mạch máu của mô hình</h4>
                      <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                        Một mô hình học sâu 50 lớp phức tạp mà nạp dữ liệu rác, nhãn sai lệch vô lý, cũng chỉ cho ra dự tính rác rưởi. Dành 80% thời gian để làm sạch, xử lý dữ liệu luôn luôn là cách kỹ sư tài năng phân bổ công sức!
                      </p>
                    </div>
                  </div>

                  {/* Rule 3 */}
                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-1.5 hover:border-border-primary transition-all flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-extrabold text-emerald-400 font-mono block uppercase">RULE 3: BASELINE FIRST (LUÔN BẮT ĐẦU ĐƠN GIẢN)</span>
                      <h4 className="text-xs font-black text-slate-200">Đừng dùng đại bác bắn chim sẻ</h4>
                      <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                        Trước khi lạm dụng mạng thần kinh chồng chéo, hãy thử giải bằng lệnh <strong>if/else cơ bản</strong>, hay Hồi Quy Tuyến Tính đơn giản. Những giải pháp tối giản này dễ giải thích cho sếp và cực kỳ tiết kiệm chi phí chạy server Cloud!
                      </p>
                    </div>
                  </div>

                  {/* Rule 4 */}
                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-1.5 hover:border-border-primary transition-all flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-extrabold text-blue-400 font-mono block uppercase">RULE 4: FEATURE ENGINEERING IS KING</span>
                      <h4 className="text-xs font-black text-slate-200">Biểu diễn thuộc tính là chìa khóa đổi đời</h4>
                      <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                        Chọn và chuyển đổi thuộc tính thô thông minh giúp mô hình tăng mạnh trí tuệ. Ví dụ thay vì đoán giá nhà theo ngày xây dựng, hãy đổi thành số năm sử dụng, hoặc khoảng cách cột cây số tới trạm tàu điện gần nhất!
                      </p>
                    </div>
                  </div>

                  {/* Rule 5 */}
                  <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-1.5 hover:border-border-primary transition-all flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-extrabold text-rose-400 font-mono block uppercase">RULE 5: TƯƠNG QUAN KHÔNG PHẢI NHÂN QUẢ</span>
                      <h4 className="text-xs font-black text-slate-200">Đừng bị sập bẫy trước biểu đồ biến thiên song hành</h4>
                      <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                        Số lượng bán kem và số vụ cháy rừng cùng tăng phi mã vào mùa hè. Tuy nhiên kem không phải nguyên nhân gây cháy rừng! Cả hai biến đều do tác nhân thời tiết nóng bức dội vào. Hãy luôn cẩn thận tìm nguyên do gốc rễ!
                      </p>
                    </div>
                  </div>

                  {/* Encouragement panel */}
                  <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl flex flex-col justify-between text-[#818cf8]">
                    <div>
                      <span className="text-[9.5px] font-black uppercase font-mono text-indigo-300">Lời chúc từ Hệ thống:</span>
                      <h4 className="text-xs font-bold text-slate-200 mt-1">Hành trình ngàn dặm bắt đầu từ một bước chân</h4>
                      <p className="text-[10px] text-text-secondary mt-1 leading-relaxed font-semibold">
                        Chào mừng bạn gia nhập thế giới Máy Học. Chúc bạn sẽ sớm chế tạo được những mô hình AI xuất sắc rực rỡ nhất!
                      </p>
                    </div>
                    <span className="text-[9px] font-black font-mono text-indigo-400 flex items-center gap-1 mt-3">
                      LƯU VỰC TRÍ TUỆ GIẢ LẬP <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================= TAB 3: MONETIZATION GAME MOBILE ======================= */}
      {activeTab === 'monetization' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Guide & Comparison */}
            <div className="lg:col-span-7 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Chiến lược tối ưu hóa doanh thu
                </span>
                <h3 className="text-lg font-black text-text-primary">Mô hình Doanh thu & Tích hợp Ads</h3>
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                  Tại Việt Nam và các thị trường Đông Nam Á phổ biến, người tiêu dùng cực kỳ hạn chế việc chi tiền mua game trả tiền một lần (Premium) hay nạp vật phẩm trong app (IAP/Freemium). Do đó, mô hình <strong>Free-to-Play tích hợp Quảng cáo thưởng (Rewarded Ads)</strong> mang lại doanh thu bền bỉ và ổn định nhất cho solo founder.
                </p>
              </div>

              {/* Models Comparison list */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-200">Free-to-Play + Ads</span>
                  <p className="text-[11px] text-text-secondary font-medium leading-normal">
                    Doanh thu từ Ads (Banner, Interstitial, Rewarded). Phù hợp nhất cho thị trường VN, dễ kéo DAU tăng vọt nhanh chóng.
                  </p>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-200">Freemium (IAP Hybrid)</span>
                  <p className="text-[11px] text-text-secondary font-medium leading-normal">
                    Tải game miễn phí, đóng phí để gỡ quảng cáo hoặc mua vàng ròng. Chuyển đổi khá chậm nhưng ổn định dài hạn.
                  </p>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-200">Premium (Trả 1 lần)</span>
                  <p className="text-[11px] text-text-secondary font-medium leading-normal">
                    Trả trước $0.99 - $4.99 để tải game. Chỉ hoạt động tốt tại các nước có tỷ lệ thẻ visa cao (Mỹ, Châu Âu, Nhật Bản).
                  </p>
                </div>
              </div>

              {/* SDK placement guidelines */}
              <div className="space-y-3 bg-slate-950/80 p-4 border border-slate-850 rounded-xl">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Mẫu vị trí đặt SDK quảng cáo tối ưu
                </h4>
                <ul className="space-y-2.5 text-xs text-text-secondary font-semibold pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <span><strong>Banner Ads:</strong> Luôn neo cứng ở đáy hoặc đỉnh màn hình chính của game, tránh nằm đè lên nút điều khiển cảm ứng.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <span><strong>Interstitial Ads (Quảng cáo xen kẽ):</strong> Chỉ xuất hiện một lần khi người chơi thua trận quá 3 lần liên tiếp. Tuyệt đối không cho nổ ngay lúc đang chơi dở gây ức chế gỡ app.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <span><strong>Rewarded Video (Quảng cáo nhận thưởng):</strong> Cho phép hồi sinh ngay tức thì khi va chạm bẫy, hoặc nhân đôi lượng vàng tích lũy sau ván đấu. Mang lại tỷ lệ nhấp chuột (CTR) cao nhất.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Dynamic Revenue Calculator & Chart */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Bộ Công Cụ Ước Tính Doanh Thu Điện Thoại</h4>
                
                {/* Inputs */}
                <div className="space-y-3.5 bg-slate-950 p-4 border border-slate-850 rounded-xl">
                  {/* Slider 1: DAU */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-text-secondary">
                      <span>Daily Active Users (DAU):</span>
                      <span className="text-amber-400 font-mono">{monetDAU.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={50000}
                      step={500}
                      value={monetDAU}
                      onChange={e => setMonetDAU(parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-bg-surface rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Slider 2: CTR */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-text-secondary">
                      <span>Tỷ lệ click quảng cáo (CTR):</span>
                      <span className="text-amber-400 font-mono">{monetCTR}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={8.0}
                      step={0.1}
                      value={monetCTR}
                      onChange={e => setMonetCTR(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-bg-surface rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Slider 3: eCPM */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-text-secondary">
                      <span>Mức giá eCPM trung bình ($):</span>
                      <span className="text-amber-400 font-mono">${monetECPM.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={15.0}
                      step={0.1}
                      value={monetECPM}
                      onChange={e => setMonetECPM(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-bg-surface rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Calculation Outputs */}
                <div className="p-4 bg-amber-950/10 border border-amber-900/20 rounded-xl flex justify-between items-center text-amber-400">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest font-black block">Doanh Thu Dự Kiến/Ngày</span>
                    <strong className="text-2xl font-black font-mono">
                      ${(monetDAU * (monetCTR / 100) * monetECPM).toFixed(2)}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono tracking-widest font-black block text-text-secondary">Ước tính VND (VCB)</span>
                    <strong className="text-sm font-bold text-text-secondary font-mono">
                      ~{Math.round((monetDAU * (monetCTR / 100) * monetECPM) * 25400).toLocaleString()}đ
                    </strong>
                  </div>
                </div>

                {/* Vertical CSS Bar Chart */}
                <div className="space-y-2">
                  <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold font-mono">
                    So sánh eCPM trung bình hệ thống ($ per 1,000 views)
                  </span>
                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-3.5">
                    {/* VN */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-text-secondary">
                        <span>Thị trường Việt Nam (VN) - Thấp:</span>
                        <span className="font-mono text-amber-500">$0.80</span>
                      </div>
                      <div className="h-2 w-full bg-bg-primary rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500/80 rounded-full" style={{ width: '8%' }}></div>
                      </div>
                    </div>
                    {/* JP */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-text-secondary">
                        <span>Thị trường Nhật Bản (JP) - Cao:</span>
                        <span className="font-mono text-amber-500">$9.50</span>
                      </div>
                      <div className="h-2 w-full bg-bg-primary rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500/80 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    {/* US */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-text-secondary">
                        <span>Thị trường Hoa Kỳ (US) - Cực Cao:</span>
                        <span className="font-mono text-amber-500">$12.00</span>
                      </div>
                      <div className="h-2 w-full bg-bg-primary rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500/80 rounded-full" style={{ width: '95%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-text-tertiary font-semibold border-t border-slate-900/60 pt-3">
                * Note: eCPM dao động mạnh phụ thuộc vào chất lượng, tỷ lệ giữ chân người dùng (Retention) và số lượt hiển thị được tối ưu qua thuật toán AdMob.
              </div>
            </div>
          </div>

          {/* Copyable code instructions */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-mono font-black text-amber-400">Copy C# Code Unity - AdMob Banner Template</span>
              <button
                onClick={() => handleCopyCode(`using UnityEngine;
using GoogleMobileAds.Api;

public class BannerAdHandler : MonoBehaviour
{
    private BannerView bannerView;
    private string adUnitId = "ca-app-pub-3940256099942544/6300978111"; // Mã Test Banner

    void Start() {
        MobileAds.Initialize(initStatus => { RequestBanner(); });
    }

    private void RequestBanner() {
        // Hủy banner cũ nếu chạy lại màn chơi
        if (bannerView != null) {
            bannerView.Destroy();
        }

        // Tạo kích thước chuẩn banner cho điện thoại di động
        bannerView = new BannerView(adUnitId, AdSize.Banner, AdPosition.Bottom);
        AdRequest request = new AdRequest();
        
        // Tải quảng cáo trực tiếp từ luồng
        bannerView.LoadAd(request);
    }
}`)}
                className="text-[10px] font-black uppercase text-amber-400 hover:text-amber-300 px-3 py-1 border border-amber-500/20 bg-amber-500/10 rounded-lg cursor-pointer"
              >
                {copiedCodeFlag ? "Đã sao chép!" : "Sao chép template"}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 border-t border-slate-900 overflow-x-auto text-[11px] font-mono text-text-secondary rounded-xl leading-relaxed select-text">
{`using UnityEngine;
using GoogleMobileAds.Api;

public class BannerAdHandler : MonoBehaviour
{
    private BannerView bannerView;
    private string adUnitId = "ca-app-pub-3940256099942544/6300978111"; // Mã Test Banner

    void Start() {
        MobileAds.Initialize(initStatus => { RequestBanner(); });
    }

    private void RequestBanner() {
        if (bannerView != null) bannerView.Destroy();
        bannerView = new BannerView(adUnitId, AdSize.Banner, AdPosition.Bottom);
        AdRequest request = new AdRequest();
        bannerView.LoadAd(request);
    }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* ======================= TAB 4: CROSS-PLATFORM STACK ======================= */}
      {activeTab === 'crossplatform' && (() => {
        // Advanced calculations for Godot 4.6 Zero-Royalty Revenue Protection Model
        // Unity Cost = seat license ($2040/user for Pro if revenue > $200k) + runtime fee (estimated at $0.10/install if downloads > 200k & revenue > $1M)
        const unitySeatCost = godotRevenue > 200000 ? 2040 : 0;
        const unityRuntimeCost = (godotRevenue > 1000000 && godotDownloads > 200000) ? (godotDownloads - 200000) * 0.15 : 0;
        const totalUnityCost = unitySeatCost + unityRuntimeCost;

        // Unreal Cost = 5% of gross revenue above $1M USD
        const totalUnrealCost = godotRevenue > 1000000 ? (godotRevenue - 1000000) * 0.05 : 0;

        // Godot Cost is absolute zero!
        const totalGodotCost = 0;

        // Peak potential fee saved
        const maxCompetitorFee = Math.max(totalUnityCost, totalUnrealCost);
        const revenueProtectionRate = godotRevenue > 0 ? (maxCompetitorFee / godotRevenue) * 100 : 0;

        return (
          <div className="space-y-6 select-text">
            
            {/* INFORMATIVE UPPER CHASSIS */}
            <div className="bg-[#0a0f1d] border border-border-primary rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-4">
              <div className="absolute right-0 top-0 -mt-10 -mr-10 w-40 h-40 rounded-full bg-purple-500/5 blur-3xl animate-pulse"></div>
              <div>
                <span className="text-[10px] font-black text-emerald-450 uppercase font-mono block tracking-widest text-emerald-450">Trang 5, 6 &amp; 7: Sức Mạnh Công Nghệ Tiết Kiệm</span>
                <h3 className="text-sm font-black uppercase text-text-primary mt-1 flex items-center gap-1.5 font-sans">
                  🚀 Hệ Sinh Thái Đa Nền Tảng &amp; Trọng Tâm Godot 4.6 (Core Game Engines Hub)
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed font-semibold max-w-4xl">
                  Để tối đa hóa tỷ suất lợi nhuận ròng rã và giải phóng đôi tay Solo Founder, ta phân loại rõ rệt giữa <strong className="text-text-primary">Core Stacks ứng dụng thương mại</strong> và <strong className="text-text-primary">Game Engines tính năng cao</strong>. Khám phá các công nghệ giúp bảo biên lợi nhuận tuyệt đối 0% chiết khấu.
                </p>
              </div>

              {/* STAGE SELECTION PILLS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                <div className="text-center py-2 bg-bg-primary/60 rounded-lg border border-slate-850/50">
                  <span className="text-[9px] font-black text-text-tertiary font-mono block leading-none">RENDER ENGINE</span>
                  <span className="text-[11px] text-text-primary font-extrabold mt-1 inline-block">Vulkan Mobile</span>
                </div>
                <div className="text-center py-2 bg-bg-primary/60 rounded-lg border border-slate-850/50">
                  <span className="text-[9px] font-black text-text-tertiary font-mono block leading-none">ARCHITECTURE</span>
                  <span className="text-[11px] text-text-primary font-extrabold mt-1 inline-block">Node Composition</span>
                </div>
                <div className="text-center py-2 bg-bg-primary/60 rounded-lg border border-slate-850/50">
                  <span className="text-[9px] font-black text-text-tertiary font-mono block leading-none">ROYALTY RATE</span>
                  <span className="text-[11px] text-emerald-400 font-extrabold mt-1 inline-block">0% GPLv3 / MIT</span>
                </div>
                <div className="text-center py-2 bg-bg-primary/60 rounded-lg border border-slate-850/50">
                  <span className="text-[9px] font-black text-text-tertiary font-mono block leading-none">PORTING ENGINE</span>
                  <span className="text-[11px] text-sky-400 font-extrabold mt-1 inline-block">GABE &amp; Xogot iOS</span>
                </div>
              </div>
            </div>

            {/* 1. INTERACTIVE REVENUE PROTECTION ANALYZER */}
            <div className="bg-slate-950 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <span className="text-[10px] font-black text-amber-500 uppercase font-mono block">GODOT ZERO-ROYALTY FINANCIAL CALCULATOR (Trang 6 &amp; 7)</span>
                <h4 className="text-sm font-black text-text-primary uppercase mt-0.5">
                  🛡️ Trình Giả Lập Bảo Toàn Doanh Thu Số - Godot vs Unity vs Unreal
                </h4>
                <p className="text-xs text-text-secondary font-semibold leading-relaxed mt-1">
                  Kéo thanh trượt để giả lập mục tiêu doanh thu vòng đời sản phẩm game của bạn hằng năm. Khám phá cách Godot giữ an toàn tài chính 100% dòng tiền của Solo Founder so với mức phí biến đổi phức tạp của đối thủ.
                </p>
              </div>

              <div className="grid lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Sliders Configuration Column */}
                <div className="lg:col-span-6 bg-bg-primary border border-slate-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    {/* Expected Lifetime Revenue */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-black">
                        <span className="text-text-secondary">Dự kiến doanh thu trọn đời (Vòng 24 tháng):</span>
                        <span className="text-emerald-400 font-mono text-sm">${godotRevenue.toLocaleString()} USD</span>
                      </div>
                      <input
                        type="range"
                        min="50000"
                        max="2500000"
                        step="50000"
                        value={godotRevenue}
                        onChange={(e) => setGodotRevenue(parseInt(e.target.value))}
                        className="w-full accent-emerald-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-550 font-bold font-mono">
                        <span>$50,000</span>
                        <span>$1,000,000 (Mốc Unreal)</span>
                        <span>$2,500,000</span>
                      </div>
                    </div>

                    {/* Expected Lifetime Downloads */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-black">
                        <span className="text-text-secondary">Dự kiến số lượt cài đặt di động (Downloads):</span>
                        <span className="text-purple-400 font-mono text-sm">{godotDownloads.toLocaleString()} lượt tải</span>
                      </div>
                      <input
                        type="range"
                        min="10000"
                        max="2000000"
                        step="50000"
                        value={godotDownloads}
                        onChange={(e) => setGodotDownloads(parseInt(e.target.value))}
                        className="w-full accent-purple-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-550 font-bold font-mono">
                        <span>10,000</span>
                        <span>500,000</span>
                        <span>2,000,000</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl space-y-1 text-[11px] leading-relaxed font-semibold">
                    <span className="text-text-primary">💡 Giải Thích Cơ Chế Thẩm Định:</span>
                    <p className="text-text-secondary">
                      * <strong className="text-text-primary">Unity Cost:</strong> Yêu cầu nâng cấp lên gói Pro ($2,040/năm/ghế) khi doanh thu cán mốc $200k. Doanh thu &gt; $1M kèm lượt tải vượt 200k sẽ chịu phí Runtime fee trung bình $0.15/download.
                    </p>
                    <p className="text-text-secondary mt-1">
                      * <strong className="text-text-primary">Unreal Engine Cost:</strong> Thu phí đúng <strong className="text-rose-455">5% gross revenue</strong> cho bất kể đồng đô la nào thu được sau khi đạt mốc doanh thu $1,000,000 USD.
                    </p>
                  </div>
                </div>

                {/* Live Benchmark Financial Dashboard Card */}
                <div className="lg:col-span-6 bg-[#040811] border border-slate-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-mono text-text-tertiary font-bold uppercase tracking-wider block">COMPETITIVE FEES OUTFLOW MATRIX</span>
                    
                    <div className="space-y-2 text-xs font-bold">
                      {/* Unreal Fee */}
                      <div className="flex justify-between items-center p-2.5 bg-bg-primary border border-slate-850/60 rounded-xl">
                        <span className="text-slate-350 flex items-center gap-1.5 font-sans">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          Ước tính phí Unreal (5% sau $1M):
                        </span>
                        <span className="text-rose-400 font-mono">{totalUnrealCost > 0 ? `$${Math.round(totalUnrealCost).toLocaleString()}` : '$0 (Miễn phí dưới mức sàn)'}</span>
                      </div>

                      {/* Unity Fee */}
                      <div className="flex justify-between items-center p-2.5 bg-bg-primary border border-slate-850/60 rounded-xl">
                        <span className="text-slate-350 flex items-center gap-1.5 font-sans">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          Ước tính phí Unity (Pro + Runtime):
                        </span>
                        <span className="text-orange-400 font-mono">${Math.round(totalUnityCost).toLocaleString()}</span>
                      </div>

                      {/* Godot fee */}
                      <div className="flex justify-between items-center p-2.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                        <span className="text-slate-200 flex items-center gap-1.5 font-sans">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          Chi phí Godot Engine (Cộng đồng MIT):
                        </span>
                        <span className="text-emerald-400 font-bold font-mono">$0 USD (Mãi mãi 0đ!)</span>
                      </div>
                    </div>
                  </div>

                  {/* Highlights section inside block */}
                  <div className="p-4 bg-bg-primary border border-slate-850 rounded-xl space-y-2">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-xs text-text-secondary">Biên bảo vệ dòng tiền (Saved Money):</span>
                      <span className="text-emerald-400 font-mono text-base font-black">
                        +${Math.round(maxCompetitorFee).toLocaleString()} USD
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(100, Math.max(5, (maxCompetitorFee / (godotRevenue || 500000)) * 100))}%` }}
                      ></div>
                    </div>

                    <div className="text-[10px] text-slate-450 leading-relaxed font-bold">
                      🔥 <strong>Nhận định:</strong> Chọn Godot giúp bảo vệ gần <strong className="text-text-primary">{revenueProtectionRate.toFixed(1)}%</strong> doanh số khỏi bị cắt phăng vô lý. Số tiền tiết kiệm đủ để thuê ngoài 2 nghệ sĩ vẽ graphic 2D rực rỡ cho phần tiếp theo!
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. DỮ LIỆU BẢO ĐỐI PHÁP CORE APP STACKS (Trang 5) */}
            <div className="bg-slate-950/40 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <span className="text-[10px] font-black text-sky-400 uppercase font-mono block">Trang 5: Bảng đối chiếu core app stacks</span>
                <h4 className="text-sm font-black text-text-primary uppercase mt-0.5">
                  📱 So Sánh Công Nghệ Framework Ứng Dụng Hướng Thương Mại (Cross-Platform Stacks)
                </h4>
                <p className="text-xs text-text-secondary font-semibold leading-relaxed mt-1">
                  Nếu bạn không làm game mà đang kiến tạo các sản phẩm di động thương mại, phần mềm quản hạch toán (Ví dụ: LedgerFlow, CRM, ASO tools), dưới đây là khung chỉ số đối chiếu chính xác từ trang 5 của báo cáo:
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-text-tertiary text-[10px] uppercase font-bold">
                      <th className="py-2.5 px-3">Framework</th>
                      <th className="py-2.5 px-3">Ngôn ngữ</th>
                      <th className="py-2.5 px-3 text-center">Bundle tối thiểu</th>
                      <th className="py-2.5 px-3 text-center">Hiệu năng dựng</th>
                      <th className="py-2.5 px-3">Ưu điểm nổi bật cho Solo Founder</th>
                      <th className="py-2.5 px-3">Ứng dụng tiêu biểu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-text-secondary font-semibold font-sans">
                    <tr className="hover:bg-bg-primary/40 transition-all">
                      <td className="py-3 px-3 font-bold text-text-primary flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                        Flutter
                      </td>
                      <td className="py-3 px-3 font-mono text-sky-450 text-sky-400">Dart</td>
                      <td className="py-3 px-3 text-center font-mono">~7MB - 9MB</td>
                      <td className="py-3 px-3 text-center text-emerald-400">Độc lập (Impeller Engine)</td>
                      <td className="py-3 px-3">Rực rỡ, ít lỗi lệch giao diện giữa máy Android/iOS. Chạy mượt sướng.</td>
                      <td className="py-3 px-3 text-text-secondary italic">Ví điện tử, app giao hàng</td>
                    </tr>

                    <tr className="hover:bg-bg-primary/40 transition-all">
                      <td className="py-3 px-3 font-bold text-text-primary flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        React Native
                      </td>
                      <td className="py-3 px-3 font-mono text-blue-400">JS / TS (React)</td>
                      <td className="py-3 px-3 text-center font-mono">~15MB - 20MB</td>
                      <td className="py-3 px-3 text-center text-amber-500">Native Bridge / Hermes</td>
                      <td className="py-3 px-3">Ecosystem đồ sộ nhất, tái sử dụng 80% logic web-app sang mobile.</td>
                      <td className="py-3 px-3 text-text-secondary italic">Facebook, Shopify UI, Discord</td>
                    </tr>

                    <tr className="hover:bg-bg-primary/40 transition-all">
                      <td className="py-3 px-3 font-bold text-text-primary flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                        Tauri
                      </td>
                      <td className="py-3 px-3 font-mono text-orange-400">JS / Web + Rust</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-400">~2MB - 4MB</td>
                      <td className="py-3 px-3 text-center text-emerald-400">Native OS WebView</td>
                      <td className="py-3 px-3">Siêu gọn nhẹ, bảo mật Rust, chuyển hóa Web-App sang Desktop cực nhạy.</td>
                      <td className="py-3 px-3 text-text-secondary italic">Công cụ xuất báo cáo hạch toán</td>
                    </tr>

                    <tr className="hover:bg-bg-primary/40 transition-all">
                      <td className="py-3 px-3 font-bold text-text-primary flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                        Kotlin Multiplatform (KMP)
                      </td>
                      <td className="py-3 px-3 font-mono text-purple-400">Kotlin</td>
                      <td className="py-3 px-3 text-center font-mono">~3MB - 5MB</td>
                      <td className="py-3 px-3 text-center text-emerald-400">Bản địa (Native UI)</td>
                      <td className="py-3 px-3">Chỉ chia sẻ logic nghiệp vụ, UI biên dịch riêng biệt tối ưu xuất sắc.</td>
                      <td className="py-3 px-3 text-text-secondary italic">App ngân hàng, Netflix Mobile</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. CORE GAME ENGINES COMPARISON (Original section, keeping values clean) */}
            <div className="bg-slate-950/40 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <span className="text-[10px] font-black text-purple-400 uppercase font-mono block">Trang 6: So sánh tính năng game engine</span>
                <h4 className="text-sm font-black text-text-primary uppercase mt-0.5">
                  👾 So Sánh Độc Lập Các Công Cụ Lập Trình Game Cho Solo Founder
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-text-tertiary text-[10px] uppercase font-bold">
                      <th className="py-2.5 px-3">Engine / Công cụ</th>
                      <th className="py-2.5 px-3">Ngôn ngữ</th>
                      <th className="py-2.5 px-3">Phí bản quyền</th>
                      <th className="py-2.5 px-3">Ưu điểm cho Solo Founder VN</th>
                      <th className="py-2.5 px-3">Nhược điểm gốc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-text-secondary font-semibold font-sans">
                    <tr className="hover:bg-bg-primary/40 transition-all">
                      <td className="py-3 px-3 font-bold text-text-primary">Godot Engine 4.6</td>
                      <td className="py-3 px-3 font-mono text-emerald-405 text-emerald-400">GDScript / C#</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">Free hoàn toàn (MIT)</td>
                      <td className="py-3 px-3">Cực kỳ nhẹ (&lt;100MB), khởi động 1 giây, Vulkan mượt bốc, modular node.</td>
                      <td className="py-3 px-3">Thị phần 3D yếu hơn Unity, ít video tut nâng cao Việt hóa.</td>
                    </tr>
                    <tr className="hover:bg-bg-primary/40 transition-all">
                      <td className="py-3 px-3 font-bold text-text-primary">Phaser.js / Web</td>
                      <td className="py-3 px-3 font-mono text-yellow-400">JavaScript / TS</td>
                      <td className="py-3 px-3 text-emerald-400">Free hoàn toàn (MIT)</td>
                      <td className="py-3 px-3">Tuyệt đối mượt mà nhất khi làm game Web 2D, đẩy lên mini-app.</td>
                      <td className="py-3 px-3">Khó biên dịch ra file gốc di động (phải dùng Capacitor).</td>
                    </tr>
                    <tr className="hover:bg-bg-primary/40 transition-all text-text-secondary">
                      <td className="py-3 px-3 font-bold text-text-secondary">Unity 2D/3D</td>
                      <td className="py-3 px-3 font-mono">C#</td>
                      <td className="py-3 px-3">Free nếu doanh thu &lt;$100K</td>
                      <td className="py-3 px-3">Ecosystem dồi dào, ngập tràn tài liệu học tập, tối ưu hóa về Ads.</td>
                      <td className="py-3 px-3">Mô hình thu phí cài đặt gây tranh cãi, nặng nề, load lâu.</td>
                    </tr>
                    <tr className="hover:bg-bg-primary/40 transition-all">
                      <td className="py-3 px-3 font-bold text-text-primary">Cocos Creator</td>
                      <td className="py-3 px-3 font-mono text-purple-400">TypeScript</td>
                      <td className="py-3 px-3 text-emerald-400">Miễn phí</td>
                      <td className="py-3 px-3">Hàng đầu Châu Á cho Game HTML5, tối ưu hóa cho di động phổ thông rẻ.</td>
                      <td className="py-3 px-3">Cộng đồng Phương Tây yếu, tài liệu code gốc đa số tiếng Trung.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. INTERACTIVE GODOT SCENE NODE COMPOSITION TREE SIMULATOR (Trang 6 & 7) */}
            <div className="grid lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Node tree diagram builder display card */}
              <div className="lg:col-span-7 bg-slate-950 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[9.5px] font-mono text-purple-400 font-extrabold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded leading-none">
                    ENGINE COMPOSITION ENGINE
                  </span>
                  <h4 className="text-xs font-black text-text-primary uppercase flex items-center gap-1.5">
                    🌳 Bản Đồ Ghép Nối Nốt Sông (Godot Node Composition vs Class Inheritance)
                  </h4>
                  <p className="text-[11.5px] text-text-secondary leading-normal font-semibold">
                    Thay vì kế thừa rườm rà (Inheritance) của lập trình truyền thống dễ gây thắt nút cổ chai, Godot dùng cơ chế <strong className="text-text-primary">Gom nhóm nốt độc lập (Node Composition)</strong>. Nhấp chọn các thực thể để soi cấu trúc cây lắp ráp:
                  </p>
                </div>

                {/* Sub tabs selectors */}
                <div className="flex gap-2 p-1.5 bg-[#070b13] border border-slate-850 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider">
                  {[
                    { id: 'player', label: '🛡️ Nhân Vật Chơi (Player Node)' },
                    { id: 'enemy', label: '👾 Kẻ Địch AI (Enemy Node)' },
                    { id: 'ui', label: '📱 HUD Điều Khiển (UI Node)' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setGodotSelectedNode(tab.id as any)}
                      className={`flex-1 py-1.5 rounded-lg border text-center transition-all ${
                        godotSelectedNode === tab.id
                          ? 'bg-purple-550 bg-purple-600 border-purple-500 text-text-primary shadow'
                          : 'border-transparent text-text-tertiary hover:text-slate-350'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Simulated File Nodes Display Panel */}
                <div className="bg-bg-primary border border-slate-850 p-4 rounded-xl space-y-3 font-mono text-[11px] leading-relaxed select-none">
                  {godotSelectedNode === 'player' && (
                    <div className="space-y-1 text-purple-300">
                      <div className="text-text-primary font-extrabold flex items-center gap-1.5">
                        <span>📦 Player (CharacterBody2D)</span>
                        <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-purple-400 rounded">Gốc Vật Lý 2D</span>
                      </div>
                      <div className="pl-6 border-l border-border-primary">
                        <div>├── 👤 Sprite (AnimatedSprite2D) &lt;-- Quản lý khung hình hoạt họa chạy, nhảy</div>
                        <div>├── 📐 Collision (CollisionShape2D) &lt;-- Định hình khối va chạm hộp</div>
                        <div>├── 🧭 FeetDetector (RayCast2D) &lt;-- Kỹ thuật quét chạm mặt đất siêu tốc</div>
                        <div className="text-emerald-450 text-emerald-400 font-bold">├── 📜 PlayerControl.gd (Script) &lt;-- Đo gánh lực bay trọng lực</div>
                        <div>└── 🔊 HapticAudio (AudioStreamPlayer2D) &lt;-- SFX ăn vàng nổ rung điện thoại</div>
                      </div>
                    </div>
                  )}

                  {godotSelectedNode === 'enemy' && (
                    <div className="space-y-1 text-rose-300">
                      <div className="text-text-primary font-extrabold flex items-center gap-1.5">
                        <span>📦 PatrolBat (CharacterBody2D)</span>
                        <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 text-rose-420 rounded">Quái Bay AI</span>
                      </div>
                      <div className="pl-6 border-l border-border-primary">
                        <div>├── 👤 Sprite (AnimatedSprite2D) &lt;-- Chớp cánh dơi bay đêm</div>
                        <div>├── 📐 Collision (CollisionShape2D) &lt;-- Hình tròn đo va đâm</div>
                        <div>├── 🚨 DetectionRange (Area2D) &lt;-- Bán kính vùng phát hiện ra Player</div>
                        <div className="text-emerald-405 text-emerald-400 font-bold">├── 📜 PatrollingAI.gd (Script) &lt;-- Quét trạng thái tuần tiễu xích zắc</div>
                        <div>└── ⏱️ PathTimer (Timer) &lt;-- Đồng hồ đếm giây tự động đổi hướng quái</div>
                      </div>
                    </div>
                  )}

                  {godotSelectedNode === 'ui' && (
                    <div className="space-y-1 text-sky-300">
                      <div className="text-text-primary font-extrabold flex items-center gap-1.5">
                        <span>📦 CanvasLayer (HUD)</span>
                        <span className="text-[9px] bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 text-sky-400 rounded">Trình Chiếu Giao Diện</span>
                      </div>
                      <div className="pl-6 border-l border-border-primary">
                        <div>├── 🏷️ MarginContainer (Căn lề chuẩn dòng di động)</div>
                        <div className="pl-6 border-l border-slate-850">
                          <div>├── 📊 ScoreText (Label) &lt;-- Hiển thị số lượng vàng tích hũ ròng rã</div>
                          <div>└── 🛒 ShopButton (TextureButton) &lt;-- Nhấn mở hòm nạp AdMob Ads</div>
                        </div>
                        <div className="text-emerald-405 text-emerald-400 font-bold">├── 📜 HUDManager.gd (Script) &lt;-- Liên thông update UI khi đổi điểm</div>
                        <div>└── 🎬 UIAnimator (AnimationPlayer) &lt;-- Trình diễn nổ số nhảy múa</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-450 leading-normal font-bold">
                  🧩 <strong>Lợi thế của Composition:</strong> Muốn dơi tuần tiễu biết phát nổ âm thanh khi chết? Chỉ cần kéo thả nốt <code className="text-text-secondary">AudioStreamPlayer2D</code> vào rã nốt dơi. Không hề cần viết lại lớp con kế thừa lớp cha vô cùng nan giải!
                </div>
              </div>

              {/* Godot script switch controller */}
              <div className="lg:col-span-5 bg-slate-950 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[9.5px] font-mono text-emerald-400 font-extrabold uppercase">GDScript vs C# Comparison (Trang 6)</span>
                  <h4 className="text-xs font-black text-text-primary uppercase flex items-center gap-1.5">
                    📜 Lập Trình Nhân Vật Vật Lý Siêu Tốc
                  </h4>
                  <p className="text-[11px] text-text-secondary leading-normal font-semibold">
                    Godot 4.6 hỗ trợ tuyệt vời GDScript (ngôn ngữ tựa Python, dễ học, tích hợp sâu vào engine, cực nhanh) và C# (cho các hệ thống tính toán lớn).
                  </p>
                </div>

                <div className="space-y-2 border-t border-slate-900 pt-3">
                  <div className="flex justify-between items-center bg-[#070b13] p-1.5 border border-slate-850 rounded-xl text-[9px] font-mono">
                    <span className="text-text-tertiary font-bold px-2">Vật Lý Di Chuyển (Movement Physics):</span>
                    <span className="text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">GDScript Đề Nghị</span>
                  </div>

                  <pre className="p-3.5 bg-bg-primary border border-slate-850 rounded-xl overflow-x-auto text-[10px] font-mono text-emerald-300 block leading-relaxed">
{`extends CharacterBody2D

const SPEED = 250.0
const JUMP_VELOCITY = -450.0
var gravity = 980.0

func _physics_process(delta):
  # Đắp lực trọng trường rơi tự do
  if not is_on_floor():
    velocity.y += gravity * delta

  # Nhấn chạm vỗ nhảy
  if Input.is_action_just_pressed("jump") and is_on_floor():
    velocity.y = JUMP_VELOCITY

  move_and_slide()`}
                  </pre>
                </div>

                <p className="text-[10px] text-slate-450 leading-normal font-medium">
                  💡 GDScript biên dịch tức thời, dọn rác tự động, gõ code ngắn hơn C# đến 3 lần. Chỉ nên sử dụng C# khi viết hệ thống ML/thuật toán phức tạp ròng rã!
                </p>
              </div>

            </div>

            {/* 5. GABE GRADLE & XOGOT PORTABILITY CORNER (Trang 7) */}
            <div className="bg-gradient-to-r from-slate-950 via-[#0c051a] to-[#040813] border border-border-primary rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <span className="text-[10px] font-black text-purple-400 uppercase font-mono block">CÔNG CỤ PHÂN PHỐI GỐC DI ĐỘNG (DI ĐỘNG HÓA TRANG 7)</span>
                <h4 className="text-sm font-black text-rose-455 text-text-primary uppercase mt-0.5">
                  🛠️ GABE Automation Builder &amp; Xogot Editor Directly On Mobile iOS/iPad
                </h4>
                <p className="text-xs text-text-secondary font-semibold leading-relaxed mt-1">
                  Khám phá hai công cụ bẻ gãy rào cản phần cứng khắt khe của Apple/Google, hỗ trợ Solo Founder đóng gói sản phẩm mọi lúc mọi nơi:
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                
                {/* GABE Box */}
                <div className="p-5 bg-slate-950 border border-slate-850 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-5 w-24 h-24 bg-purple-500 rounded-full blur-xl"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <h5 className="text-xs font-black text-text-primary uppercase">GABE (Gradle Automated Build Engine)</h5>
                  </div>
                  <p className="text-[11.2px] text-text-secondary leading-relaxed font-semibold">
                    Hệ thống tự động hóa liên kết cấu hình Gradle, tự động kí mã số bảo mật Keystore và xuất thẳng bản build <strong className="text-purple-400">.AAB (Android App Bundle)</strong> lên thẳng nhánh thử nghiệm của Google Play Console bằng một dòng lệnh duy nhất, rút ngắn 90% thao tác thủ công lỗi.
                  </p>
                </div>

                {/* Xogot Box */}
                <div className="p-5 bg-slate-950 border border-slate-850 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-5 w-24 h-24 bg-rose-500 rounded-full blur-xl"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <h5 className="text-xs font-black text-text-primary uppercase">Xogot iPad/iPhone Native Porting Editor</h5>
                  </div>
                  <p className="text-[11.2px] text-text-secondary leading-relaxed font-semibold">
                    Giải pháp độc đáo cho phép chạy trực tiếp bộ biên tập Godot Editor mộc mạc ngay trên thiết bị iPad hoặc điện thoại iPhone cũ mà không cần ngồi máy tính PC cồng kềnh. Solo Founder có thể lập trình cơ chế va chạm, test touch controls bằng ngón tay và compile thử nghiệm mượt mà ngay trên xe bus!
                  </p>
                </div>

              </div>
            </div>

            {/* TIMELINES AND COMPLIANCE CHECKLISTS (Original detailed info, preserved with styled padding) */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-950 border border-slate-850 rounded-3xl space-y-3.5">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-455" />
                  Quy Trình Kiểm Tra Trước Khi Lên Google Play
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-450 leading-relaxed font-semibold pl-1">
                  <li className="flex gap-2">
                    <span className="text-emerald-400 font-mono">1.</span>
                    <span className="text-text-secondary">Tạo chứng chỉ Keystore .jks bảo mật cấu hình chặt chẽ.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-400 font-mono">2.</span>
                    <span className="text-text-secondary">Sử dụng tệp định dạng <strong>.AAB (Android App Bundle)</strong> để Google tự chia gói CPU phù hợp.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-400 font-mono">3.</span>
                    <span className="text-text-secondary">Khai báo câu hỏi độ tuổi người chơi (IARC) chuẩn chỉ không bạo lực.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-400 font-mono">4.</span>
                    <span className="text-text-secondary">Tích hợp AdMob Data Safety, chứng thực thu thập tệp quảng cáo trẻ em nếu tự chỉ định.</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 bg-slate-950 border border-slate-850 rounded-3xl space-y-3.5">
                <h4 className="text-xs font-black text-rose-455 uppercase tracking-widest flex items-center gap-1.5">
                  <Rocket className="w-4 h-4 text-rose-420" />
                  Quy Trình Kiểm Tra Trước Khi Lên App Store
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-450 leading-relaxed font-semibold pl-1">
                  <li className="flex gap-2">
                    <span className="text-rose-455 font-mono">1.</span>
                    <span className="text-text-secondary">Đăng ký thành viên Apple Developer Program cá nhân ($99/năm bắt buộc).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-rose-455 font-mono">2.</span>
                    <span className="text-text-secondary">Khai báo biểu mẫu Thuế Hoa Kỳ W-8BEN trực tuyến trên App Store Connect hòng giảm thuế kép.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-rose-455 font-mono">3.</span>
                    <span className="text-text-secondary">Thiết lập nốt chặn hiển thị App Tracking Transparency (ATT) bắt buộc từ iOS 14.5.</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        );
      })()}

      {/* ======================= TAB 5: GAME ANALYTICS & RETENTION ======================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Funnel chart and Metrics introduction */}
            <div className="lg:col-span-6 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="space-y-1.5">
                <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Chìa khóa sống còn của game indie
                </span>
                <h3 className="text-lg font-black text-text-primary">Chỉ số Giữ Chân Người Chơi (Retention rate)</h3>
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                  Đối với game di động F2P, chất lượng gameplay được đánh giá chính xác dựa trên ba thước đo cốt tủy: <strong>Day 1, Day 7 và Day 30 Retention</strong>. Nếu người chơi cài đặt rồi gỡ ngay trong vòng 24 giờ đầu, tỷ lệ eCPM của bạn sẽ giảm sâu về đáy và không thể thu hồi vốn chạy Marketing.
                </p>
              </div>

              {/* Conversion Funnel Representation */}
              <div className="space-y-3.5">
                <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold font-mono">Phễu Chuyển Đổi Điển Hình của Game Hyper-casual (VN)</span>
                <div className="space-y-2 font-mono">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="flex justify-between items-center px-4 py-2 bg-rose-950/15 border border-rose-900/30 rounded-xl relative z-10 text-xs">
                      <span className="font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-rose-405 rounded-full inline-block"></span>1. Lượt Cài Đặt Ban Đầu (Download)</span>
                      <span className="text-rose-400 font-extrabold text-[11px]">100% người dùng</span>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 bg-rose-955/20 rounded-xl" style={{ width: '100%' }}></div>
                  </div>
                  {/* Step 2 */}
                  <div className="relative">
                    <div className="flex justify-between items-center px-4 py-2 bg-rose-950/15 border border-rose-900/30 rounded-xl relative z-10 text-xs">
                      <span className="font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-rose-405 rounded-full inline-block"></span>2. Hoàn thành Hướng dẫn (Tutorial)</span>
                      <span className="text-rose-400 font-extrabold text-[11px]">75% giữ chân</span>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 bg-rose-955/20 rounded-xl animate-pulse" style={{ width: '75%' }}></div>
                  </div>
                  {/* Step 3 */}
                  <div className="relative">
                    <div className="flex justify-between items-center px-4 py-2 bg-rose-950/15 border border-rose-900/30 rounded-xl relative z-10 text-xs">
                      <span className="font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-rose-405 rounded-full inline-block"></span>3. Giữ Chân Ngày Đầu Tiên (Day 1)</span>
                      <span className="text-rose-400 font-extrabold text-[11px]">42% tốt đạt chuẩn</span>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 bg-rose-955/20 rounded-xl animate-pulse" style={{ width: '42%' }}></div>
                  </div>
                  {/* Step 4 */}
                  <div className="relative">
                    <div className="flex justify-between items-center px-4 py-2 bg-rose-950/15 border border-rose-900/30 rounded-xl relative z-10 text-xs">
                      <span className="font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-rose-405 rounded-full inline-block"></span>4. Giữ Chân Tuần Đầu (Day 7 Retention)</span>
                      <span className="text-rose-400 font-extrabold text-[11px]">15% trung bình lẻ</span>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 bg-rose-955/20 rounded-xl animate-pulse" style={{ width: '15%' }}></div>
                  </div>
                  {/* Step 5 */}
                  <div className="relative">
                    <div className="flex justify-between items-center px-4 py-2 bg-rose-950/15 border border-rose-900/30 rounded-xl relative z-10 text-xs">
                      <span className="font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-rose-405 rounded-full inline-block"></span>5. Người dùng trả tiền thật (Purchaser)</span>
                      <span className="text-rose-400 font-extrabold text-[11px]">2% tỷ lệ vàng</span>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 bg-rose-955/20 rounded-xl animate-pulse" style={{ width: '2%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics & Analytics Dashboard Setup */}
            <div className="lg:col-span-6 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Thiết lập Firebase Analytics cho Game 0đ</h4>
              <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                Firebase Analytics là công cụ hoàn toàn miễn phí của Google hỗ trợ đo lường hành vi người chơi cực kỳ chuyên nghiệp. Dưới đây là các sự kiện tùy chỉnh (Custom Events) quan trọng bạn bắt buộc phải ghi lại trong code để tối ưu hóa thiết kế màn chơi:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                  <div className="flex justify-between text-xs font-bold text-slate-200">
                    <span>level_start &amp; level_complete</span>
                    <span className="font-mono text-purple-400 text-[10.5px]">Độ khó màn</span>
                  </div>
                  <p className="text-[11px] text-text-secondary font-semibold mt-1">
                    Đặt mốc ghi lại số lần người chơi chịu thua quá nhiều để giảm bớt độ nhảy hoặc bớt chướng ngại vật ngay tức thời.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                  <div className="flex justify-between text-xs font-bold text-slate-200">
                    <span>ad_impression_reward</span>
                    <span className="font-mono text-emerald-400 text-[10.5px]">Doanh thu</span>
                  </div>
                  <p className="text-[11px] text-text-secondary font-semibold mt-1">
                    Ghi lại số lượt người chơi sẵn lòng click vào tab xem Ads để nhận quà. Đây là cơ sở để liên thông định hình chỉ số LTV (Life Time Value).
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                  <div className="flex justify-between text-xs font-bold text-slate-200">
                    <span>tutorial_step_complete</span>
                    <span className="font-mono text-sky-400 text-[10.5px]">UX Core Feel</span>
                  </div>
                  <p className="text-[11px] text-text-secondary font-semibold mt-1">
                    Theo dõi người chơi bỏ cuộc ở bước nào trong bài hướng dẫn đầu tiên để cắt giảm sự rườm rà không đáng có.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Copyable SQL metrics template queries */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-mono font-black text-rose-455">Truy vấn SQL Phân Tích Cohort Retention Ngày 1 (D1)</span>
              <button
                onClick={() => handleCopyCode(`-- SQL truy vấn Cohort Retention D1 từ tệp database event logging
WITH user_activities AS (
  SELECT 
    user_id,
    date(created_at) as event_date,
    date(min(created_at) OVER(PARTITION BY user_id)) as first_active_date
  FROM raw_event_logs
)
SELECT 
  first_active_date,
  COUNT(DISTINCT user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN event_date = date(first_active_date, '+1 day') THEN user_id END) as retained_d1_users,
  ROUND(CAST(COUNT(DISTINCT CASE WHEN event_date = date(first_active_date, '+1 day') THEN user_id END) AS FLOAT) / COUNT(DISTINCT user_id) * 100, 2) as d1_retention_rate
FROM user_activities
GROUP BY first_active_date
ORDER BY first_active_date DESC;`)}
                className="text-[10px] font-black uppercase text-rose-405 hover:text-rose-300 px-3 py-1 border border-rose-500/20 bg-rose-500/10 rounded-lg cursor-pointer"
              >
                {copiedCodeFlag ? "Đã sao chép!" : "Sao chép mã SQL"}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 border-t border-slate-900 overflow-x-auto text-[11px] font-mono text-text-secondary rounded-xl leading-relaxed select-text">
{`WITH user_activities AS (
  SELECT 
    user_id,
    date(created_at) as event_date,
    date(min(created_at) OVER(PARTITION BY user_id)) as first_active_date
  FROM raw_event_logs
)
SELECT 
  first_active_date,
  COUNT(DISTINCT user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN event_date = date(first_active_date, '+1 day') THEN user_id END) as retained_d1_users,
  ROUND(CAST(COUNT(DISTINCT CASE WHEN event_date = date(first_active_date, '+1 day') THEN user_id END) AS FLOAT) / COUNT(DISTINCT user_id) * 100, 2) as d1_retention_rate
FROM user_activities
GROUP BY first_active_date
ORDER BY first_active_date DESC;`}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}
