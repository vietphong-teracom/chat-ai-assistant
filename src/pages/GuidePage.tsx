import { Box, Heading, Text, Image, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { IoChevronDownCircleOutline } from 'react-icons/io5';

interface GuideBlock {
  description: string;
  images?: string[];
}

interface GuideItem {
  title: string;
  blocks: GuideBlock[];
}

// Lưu ảnh local vào public/images/
// Ví dụ: public/images/capnhattintuc.png
const guideData: GuideItem[] = [
  {
    title: '1. Chức năng hỏi đáp thông thường',
    blocks: [
      {
        description: 'Người dùng có thể hỏi thông tin về mọi thứ ',
        images: ['/images/Hoidapthongthuong.png'],
      },
    ],
  },
  {
    title: '2. Chức năng cập nhật tin tức mới nhất',
    blocks: [
      {
        description: 'Bấm vào nút Cập nhật tin tức, lúc này sẽ cập nhật được tin tức từ các trang bài báo',
        images: ['/images/capnhattintuc1.png'],
      },
    ],
  },
  {
    title: '3. Chức năng tóm tắt nhanh văn bản',
    blocks: [
      {
        description:
          'Có thể chọn nhanh bằng việc bấm vào nút bấm Tóm Tắt Văn Bản bên dưới ô nhập để chọn file cần được tóm tắt (Lưu ý hiện tại chỉ đang hỗ trợ file PDF)',
        images: ['/images/tomtatvanban.png'],
      },
      {
        description: 'Bên dưới là văn bản chưa tóm tắt )',
        images: ['/images/vanbanchuatomtat.png'],
      },
    ],
  },
  {
    title: '4. Chức năng tóm tắt văn bản theo dàn ý mình mong muốn',
    blocks: [
      {
        description:
          'Có thể chọn file ở nút chọn file bên trái ô input , sau khi chọn file có thể nhập input là tóm tắt theo dàn ý mà mình mong muốn, dịch văn bản ....)',
        images: ['/images/dichtienganhvatomtat.png'],
      },
    ],
  },
  {
    title: '5. Chức năng hỗ trợ đọc văn bản',
    blocks: [
      {
        description:
          'Chọn chức năng đọc văn bản bằng nút bấm Chuyển Âm Thanh Thành Văn Bản bên dưới ô nhập , sau khi nhập có thể chọn file (hiện tại chỉ đang hỗ trợ file pdf))',
        images: ['/images/chuyendoitextthanhvanban.png'],
      },
      {
        description: 'Sau khi tạo ra xong có thể bấm nghe trực tiếp )',
      },
    ],
  },
  {
    title: '6. Chức năng ra hiệu lệnh bằng giọng nói',
    blocks: [
      {
        description:
          'Bấm vào biêủ tưởng icon Mic bên cạnh nút Gửi lúc này sẽ bắt đầu ghi âm ,người dùng nói những điều cần hỏi',
        images: ['/images/batmic.png'],
      },

      {
        description: 'Sau khi nói xong có thể bấm dừng ở nút dừng lại để hoàn thiện',
        images: ['/images/tatmic.png'],
      },
      {
        description: 'Lúc này chữ nói đã hiển thị trên ô nhập input , giúp người dùng không cần gõ tay',
        images: ['/images/hienthichutreninput.png'],
      },
    ],
  },
  {
    title: '7. Chức năng chuyển file âm thanh thành văn bản ',
    blocks: [
      {
        description: 'Bấm vào nút bấm Chuyển âm thanh thành văn bản , lúc này hãy tải file mp3 , mp4 lên ',
        images: ['/images/chonfile.png'],
      },

      {
        description: 'Sau khi chọn file xong thì sẽ có bản text lấy ra từ audio bạn đã gửi',
        images: ['/images/chuyenaudiothanhvanban.png'],
      },
    ],
  },
  {
    title: '8. Chức năng yêu cầu trợ lý ảo tiếp tục chỉnh sửa bài phát biểu theo ý mình',
    blocks: [
      {
        description: '1.Gửi đoạn phát biếu và có thể hỏi trợ lý ',
        images: ['/images/123.png'],
      },

      {
        description: '',
        images: ['/images/1234.png'],
      },
    ],
  },
  {
    title: '9. Chức năng dịch thuật tài liệu tiếng Việt sang tiếng Anh & các thứ tiếng khác, và ngược lại',
    blocks: [
      {
        description: 'Gửi file cần dịch tài liệu và bên dưới là đoạn văn đã được dịch',
        images: ['/images/dichtailieu.png'],
      },
    ],
  },
  {
    title: '10. Các quy tắc đã được cài sẵn (dặn dò) trợ lý ảo ',
    blocks: [
      {
        description: ' 1. Luôn sử dụng văn phong lịch sự, chuyên nghiệp.',
      },
      {
        description: ' 2. Không chèn thông tin không xác thực.',
      },
      {
        description: '3. Tránh dùng từ ngữ tiêu cực hoặc gây hiểu nhầm.',
      },
      {
        description: '4. Luôn giữ cấu trúc rõ ràng, dễ hiểu.',
      },
    ],
  },
];

export function GuidePage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <Box p={6}>
      <Heading size='lg' mb={6}>
        Trang Hướng Dẫn
      </Heading>

      {guideData.map((item, index) => (
        <Box key={index} border='1px solid #e2e8f0' borderRadius='md' mb={4} overflow='hidden' w='70%' mx='auto'>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            p={4}
            cursor='pointer'
            bg={openIndex === index ? 'blue.50' : 'white'}
            _hover={{ bg: 'blue.50' }}
            onClick={() => toggle(index)}
          >
            <Text fontWeight='semibold'>{item.title}</Text>
            <IoChevronDownCircleOutline transform={openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)'} />
          </Box>

          {openIndex === index && (
            <Box p={4} borderTop='1px solid #e2e8f0'>
              <VStack align='start'>
                {item.blocks.map((block, i) => (
                  <Box key={i}>
                    <Text
                      mb={2}
                      fontWeight='bold' // chữ đậm
                      color='teal.600' // màu chữ khác
                      bg='teal.50' // nền nhẹ để tạo điểm nhấn
                      px={2} // padding ngang
                      py={8} // padding dọc
                      borderRadius='md' // bo góc
                    >
                      {block.description}
                    </Text>

                    {block.images?.map((img, j) => (
                      <Image key={j} src={img} alt={`${item.title} ${i}-${j}`} borderRadius='md' mb={2} />
                    ))}
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
