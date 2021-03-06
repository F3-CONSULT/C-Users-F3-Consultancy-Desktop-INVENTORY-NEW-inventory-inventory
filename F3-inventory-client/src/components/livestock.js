import {
  Box,
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Button,
  Th,
  Td,
  Heading,
  useColorModeValue,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  Input,
  InputGroup,
  InputRightAddon,
  FormLabel,
  useDisclosure,
} from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
import { useEffect, useState } from 'react';
import { saveAs } from 'file-saver';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
// files

const LiveStock = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [file, setFile] = useState();
  const fileReader = new FileReader();
  const [mergedArray, setMergedArray] = useState([]);
  const [livestockArray, setLiveStockArray] = useState([]);
  // date filter states
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  // event handlers
  const onChangeHandler = e => {
    setFile(e.target.files[0]);
  };
  // get the merged List
  useEffect(() => {
    const mergedData = async () => {
      const response = await fetch(
        'https://shrouded-brushlands-07875.herokuapp.com/api/master/merged'
      );
      const result = await response.json(response);
      console.log(result);
      setLiveStockArray(result);
    };
    mergedData();
  }, []);
  // perform calculations and store it in backend
  const deleteList = async () => {
    await fetch(
      'https://shrouded-brushlands-07875.herokuapp.com/api/livestock/delete',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };
  const sendMergedArray = async () => {
    livestockArray.map(item =>
      fetch(
        'https://shrouded-brushlands-07875.herokuapp.com/api/livestock/create',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mastersku: item.mastersku,
            purchase:
              item.purchase.length === 0 ? 0 : item.purchase[0].quantity,
            purchaseReturn:
              item.purchaseReturn.length === 0
                ? 0
                : item.purchaseReturn[0].quantity,
            sales: item.sales.length === 0 ? 0 : item.sales[0].quantity,
            salesReturn:
              item.salesreturn.length === 0 ? 0 : item.salesReturn[0].quantity,
            skus: item.skus,
          }),
        }
      )
    );
  };
  // receive final livestock after calculations
  useEffect(() => {
    const finalLiveStock = async () => {
      const response = await fetch(
        'https://shrouded-brushlands-07875.herokuapp.com/api/livestock/getall'
      );
      const result = await response.json();
      setMergedArray(result);
    };
    finalLiveStock();
  }, []);
  // csv to array conversion
  const csvFileToArray = async string => {
    const csvHeader = string.slice(0, string.indexOf('\r')).split(',');
    const csvRows = string
      .slice(string.indexOf('\r') + 1)
      .split(/(\r\n|\n|\r)/gm);
    const array = csvRows.map(i => {
      const values = i.split(',') || i.split(' ');
      const obj = csvHeader.reduce((object, header, index) => {
        if (values.length > 1) {
          index === 1
            ? (object[header] = parseInt(values[index]))
            : (object[header] = values[index]);
          return object;
        }
        return null;
      }, {});
      return obj;
    });
    const finalArray = array.filter(item => item !== null);
    await fetch(
      'https://shrouded-brushlands-07875.herokuapp.com/api/livestock/upload',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalArray),
      }
    );
  };
  // submit csv file to function
  const onSubmitHandler = e => {
    if (file) {
      fileReader.onload = function (e) {
        const csvOutput = e.target.result;
        csvFileToArray(csvOutput);
      };
      fileReader.readAsText(file);
    }
  };
  // download file
  const downloadFile = () => {
    const csv = mergedArray
      .map(item => {
        return JSON.stringify(item);
      })
      .join('\n')
      .replace(/(^\[)|(\]$)/gm, '');
    const blob = new Blob([csv], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, 'livestock.csv');
  };
  // Date filter
  const SelectionRange = {
    startDate: startDate,
    endDate: endDate,
    key: 'selection',
  };
  const handleSelect = ranges => {
    setEndDate(ranges.selection.endDate);
    setStartDate(ranges.selection.startDate);
  };
  return (
    <Box p={4}>
      <Heading size={'lg'} pb={5}>
        Live Stock Section
      </Heading>

      {/* upload stock */}
      <HStack justifyContent={'space-between'}>
        <InputGroup size={'sm'} w={'200px'}>
          <FormLabel
            width={'100%'}
            htmlFor={'csvInput'}
            _hover={{ cursor: 'pointer' }}
            textAlign={'center'}
            pt={1}
            size="sm"
          >
            Upload File
          </FormLabel>
          <Input
            display={'none'}
            type={'file'}
            id={'csvInput'}
            accept={'.csv'}
            onChange={onChangeHandler}
          />
          <InputRightAddon
            type={'button'}
            variant={'outline'}
            children={'Select csv'}
            _hover={{ cursor: 'pointer' }}
            onClick={onSubmitHandler}
          >
            Import
            <DownloadIcon ml={1} mt={1} />
          </InputRightAddon>
        </InputGroup>
        <Button size={'sm'} onClick={onOpen}>
          Date Filter
        </Button>
        <Modal size={'sm'} isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalBody>
              <DateRange
                ranges={[SelectionRange]}
                onChange={handleSelect}
                moveRangeOnFirstSelection
                retainEndDateOnFirstSelection
                maxDate={new Date()}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </HStack>
      <Heading size={'md'} py={4}>
        Live Stock Table
      </Heading>
      <TableContainer
        rounded={'lg'}
        boxShadow={'lg'}
        h={240}
        w={1200}
        overflowY={'auto'}
        overflowX={'scroll'}
        bg={useColorModeValue('gray.100', 'gray.700')}
      >
        <Table variant="simple" size={'sm'}>
          <Thead position={'sticky'} top={0} backgroundColor={'lightblue'}>
            <Tr>
              <Th textAlign="center">Master SKU</Th>
              <Th textAlign="center">Opening Stock</Th>
              <Th textAlign="center">Purchase</Th>
              <Th textAlign="center">Sales</Th>
              <Th textAlign="center">Sales Return</Th>
              <Th textAlign="center">Purchase Return</Th>
              <Th textAlign="center">Live Stock</Th>
            </Tr>
          </Thead>
          <Tbody>
            {mergedArray.map(item => (
              <Tr key={item._id}>
                <Td textAlign="center">
                  <Menu>
                    <MenuButton>{item.mastersku}</MenuButton>
                    <MenuList>
                      {item.skus !== undefined ? (
                        item.skus.map(item => (
                          <MenuItem key={item}> {item}</MenuItem>
                        ))
                      ) : (
                        <MenuItem>None</MenuItem>
                      )}
                    </MenuList>
                  </Menu>
                </Td>
                <Td textAlign="center">
                  {item.opening_stock === undefined ? 0 : item.opening_stock}
                </Td>
                <Td textAlign="center"> {item.purchase}</Td>
                <Td textAlign="center"> {item.sales}</Td>
                <Td textAlign="center">{item.salesReturn}</Td>
                <Td textAlign="center"> {item.purchaseReturn}</Td>
                <Td textAlign="center">{item.livestock}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <HStack pt={6} justifyContent={'center'}>
        <Button size={'sm'} onClick={downloadFile}>
          Download file
        </Button>
        <Button size={'sm'} onClick={deleteList}>
          Delete
        </Button>
        <Button size={'sm'} onClick={sendMergedArray}>
          Update
        </Button>
      </HStack>
    </Box>
  );
};

export default LiveStock;
