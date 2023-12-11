import React, { useEffect, useState } from 'react';
import { Button, Form, Header, Label, Pagination, Segment, Select, Table, Popup } from 'semantic-ui-react';
import {API, copy, isAdmin, showError, showSuccess, showWarning, timestamp2string} from '../helpers';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { ITEMS_PER_PAGE } from '../constants';
import { renderQuota } from '../helpers/render';

function renderTimestamp(timestamp) {
  return (
    <>
      {timestamp2string(timestamp)}
    </>
  );
}

const MODE_OPTIONS = [
  { key: 'all', text: '全部用户', value: 'all' },
  { key: 'self', text: '当前用户', value: 'self' }
];

const LOG_OPTIONS = [
  { key: '0', text: '全部', value: 0 },
  { key: '1', text: '充值', value: 1 },
  { key: '2', text: '消费', value: 2 },
  { key: '3', text: '管理', value: 3 },
  { key: '4', text: '系统', value: 4 }
];

// const HoverContentCell = ({ content }) => {
//   const [isCopied, setIsCopied] = useState(false);
//
//   const handleCopy = () => {
//     console.log(`已复制：${content}`);
//
//     if (copy({content})) {
//       showSuccess('已复制到剪贴板！');
//     } else {
//       showWarning('无法复制到剪贴板，请手动复制。');
//     }
//     setIsCopied(true);
//
//     setTimeout(() => {
//       setIsCopied(false);
//     }, 1000);
//   };
//
//   return (
//       <Table.Cell style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//         <Popup
//             mouseLeaveDelay={1000}
//             content={
//               // <CopyToClipboard text={content}>
//               //   <span onClick={handleCopy}>{content}</span>
//               // </CopyToClipboard>
//               <CopyToClipboard text={content} onCopy={handleCopy}>
//                 <span>{content}</span>
//               </CopyToClipboard>
//             }
//             trigger={<div>{content}</div>}
//             position="top center"
//             inverted
//         />
//         {isCopied && <div>复制成功！</div>}
//       </Table.Cell>
//   );
// };

const HoverContentCell = ({ content }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {

    if (copy(content)) {
      showSuccess('已复制到剪贴板！');
    } else {
      showWarning('无法复制到剪贴板，请手动复制。');
    }
    setIsCopied(true);

  };

  return (
      <CopyToClipboard text={content} onCopy={handleCopy}>
        <Table.Cell style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Popup
              content={
                <span>{content}</span>
              }
              trigger={<div>{content}</div>}
              position="top center"
              inverted
          />
        </Table.Cell>
      </CopyToClipboard>
  );
};


function renderType(type) {
  switch (type) {
    case 1:
      return <Label basic color='green'> 充值 </Label>;
    case 2:
      return <Label basic color='olive'> 消费 </Label>;
    case 3:
      return <Label basic color='orange'> 管理 </Label>;
    case 4:
      return <Label basic color='purple'> 系统 </Label>;
    default:
      return <Label basic color='black'> 未知 </Label>;
  }
}

const LogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [showStat, setShowStat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [logType, setLogType] = useState(0);
  const isAdminUser = isAdmin();
  let now = new Date();
  const [inputs, setInputs] = useState({
    username: '',
    token_name: '',
    model_name: '',
    start_timestamp: timestamp2string(0),
    end_timestamp: timestamp2string(now.getTime() / 1000 + 3600),
    channel: '',
    request: '',
    response: ''
  });
  const { username, token_name, model_name, start_timestamp, end_timestamp, channel, request, response} = inputs;

  const [stat, setStat] = useState({
    quota: 0,
    prompt_token: 0,
    completion_token: 0,
    token: 0
  });

  const handleInputChange = (e, { name, value }) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const getLogSelfStat = async () => {
    let localStartTimestamp = Date.parse(start_timestamp) / 1000;
    let localEndTimestamp = Date.parse(end_timestamp) / 1000;
    let res = await API.get(`/api/log/self/stat?type=${logType}&token_name=${token_name}&model_name=${model_name}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}&request=${request}&response=${response}`);
    const { success, message, data } = res.data;
    if (success) {
      setStat(data);
    } else {
      showError(message);
    }
  };

  const getLogStat = async () => {
    let localStartTimestamp = Date.parse(start_timestamp) / 1000;
    let localEndTimestamp = Date.parse(end_timestamp) / 1000;
    let res = await API.get(`/api/log/stat?type=${logType}&username=${username}&token_name=${token_name}&model_name=${model_name}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}&channel=${channel}&request=${request}&response=${response}`);
    const { success, message, data } = res.data;
    if (success) {
      setStat(data);
    } else {
      showError(message);
    }
  };

  const handleEyeClick = async () => {
    if (!showStat) {
      if (isAdminUser) {
        await getLogStat();
      } else {
        await getLogSelfStat();
      }
    }
    setShowStat(!showStat);
  };

  const loadLogs = async (startIdx) => {
    let url = '';
    let localStartTimestamp = Date.parse(start_timestamp) / 1000;
    let localEndTimestamp = Date.parse(end_timestamp) / 1000;
    if (isAdminUser) {
      url = `/api/log/?p=${startIdx}&type=${logType}&username=${username}&token_name=${token_name}&model_name=${model_name}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}&channel=${channel}&request=${request}&response=${response}`;
    } else {
      url = `/api/log/self/?p=${startIdx}&type=${logType}&token_name=${token_name}&model_name=${model_name}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}&request=${request}&response=${response}`;
    }
    const res = await API.get(url);
    const { success, message, data } = res.data;
    if (success) {
      if (startIdx === 0) {
        setLogs(data);
      } else {
        let newLogs = [...logs];
        newLogs.splice(startIdx * ITEMS_PER_PAGE, data.length, ...data);
        setLogs(newLogs);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const onPaginationChange = (e, { activePage }) => {
    (async () => {
      if (activePage === Math.ceil(logs.length / ITEMS_PER_PAGE) + 1) {
        // In this case we have to load more data and then append them.
        await loadLogs(activePage - 1);
      }
      setActivePage(activePage);
    })();
  };

  const refresh = async () => {
    setLoading(true);
    setActivePage(1);
    setShowStat(false);
    await loadLogs(0);
  };

  useEffect(() => {
    refresh().then();
  }, [logType]);

  const searchLogs = async () => {
    if (searchKeyword === '') {
      // if keyword is blank, load files instead.
      await loadLogs(0);
      setActivePage(1);
      return;
    }
    setSearching(true);
    const res = await API.get(`/api/log/self/search?keyword=${searchKeyword}`);
    const { success, message, data } = res.data;
    if (success) {
      setLogs(data);
      setActivePage(1);
    } else {
      showError(message);
    }
    setSearching(false);
  };

  const handleKeywordChange = async (e, { value }) => {
    setSearchKeyword(value.trim());
  };

  const sortLog = (key) => {
    if (logs.length === 0) return;
    setLoading(true);
    let sortedLogs = [...logs];
    if (typeof sortedLogs[0][key] === 'string') {
      sortedLogs.sort((a, b) => {
        return ('' + a[key]).localeCompare(b[key]);
      });
    } else {
      sortedLogs.sort((a, b) => {
        if (a[key] === b[key]) return 0;
        if (a[key] > b[key]) return -1;
        if (a[key] < b[key]) return 1;
      });
    }
    if (sortedLogs[0].id === logs[0].id) {
      sortedLogs.reverse();
    }
    setLogs(sortedLogs);
    setLoading(false);
  };

  return (
    <>
      <Segment>
        <Header as='h3'>
          使用明细（总消耗额度：
          {showStat && renderQuota(stat.quota) + String.fromCharCode(32)}
          {!showStat && <span onClick={handleEyeClick} style={{ cursor: 'pointer', color: 'gray' }}>点击查看 {String.fromCharCode(32)}</span>}
          总消耗prompt token：
          {showStat && stat.prompt_token + String.fromCharCode(32)}
          {!showStat && <span onClick={handleEyeClick} style={{ cursor: 'pointer', color: 'gray' }}>点击查看 {String.fromCharCode(32)}</span>}
          总消耗completion token：
          {showStat && stat.completion_token + String.fromCharCode(32)}
          {!showStat && <span onClick={handleEyeClick} style={{ cursor: 'pointer', color: 'gray' }}>点击查看 {String.fromCharCode(32)}</span>}
          ）
        </Header>
        <Form>
          {
              isAdminUser && <>
                <Form.Group>
                  <Form.Input fluid label={'渠道 ID'} width={3} value={channel}
                              placeholder='可选值' name='channel'
                              onChange={handleInputChange} />
                  <Form.Input fluid label={'用户名称'} width={3} value={username}
                              placeholder={'可选值'} name='username'
                              onChange={handleInputChange} />
                  <Form.Input fluid label='请求' width={3} value={request} placeholder='支持模型输入的模糊搜索'
                              name='request'
                              onChange={handleInputChange} />
                  <Form.Input fluid label='响应' width={3} value={response} placeholder='支持模型输出的模糊搜索'
                              name='response'
                              onChange={handleInputChange} />
                  <Form.Button fluid label='操作' width={2} onClick={refresh}>查询</Form.Button>
                </Form.Group>
              </>
          }
          {
              !isAdminUser && <>
                <Form.Group>
                  <Form.Input fluid label='请求' width={6} value={request} placeholder='支持模型输入的模糊匹配搜索'
                              name='request'
                              onChange={handleInputChange} />
                  <Form.Input fluid label='响应' width={6} value={response} placeholder='支持模型输出的模糊匹配搜索'
                              name='response'
                              onChange={handleInputChange} />
                  <Form.Button fluid label='操作' width={2} onClick={refresh}>查询</Form.Button>
                </Form.Group>
              </>
          }
          <Form.Group>
            <Form.Input fluid label={'令牌名称'} width={3} value={token_name}
                        placeholder={'可选值'} name='token_name' onChange={handleInputChange} />
            <Form.Input fluid label='模型名称' width={3} value={model_name} placeholder='可选值'
                        name='model_name'
                        onChange={handleInputChange} />
            <Form.Input fluid label='起始时间' width={4} value={start_timestamp} type='datetime-local'
                        name='start_timestamp'
                        onChange={handleInputChange} />
            <Form.Input fluid label='结束时间' width={4} value={end_timestamp} type='datetime-local'
                        name='end_timestamp'
                        onChange={handleInputChange} />
          </Form.Group>
        </Form>
        <Table basic compact size='small'>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('created_time');
                }}
                width={3}
              >
                时间
              </Table.HeaderCell>
              {
                isAdminUser && <Table.HeaderCell
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    sortLog('channel');
                  }}
                  width={1}
                >
                  渠道
                </Table.HeaderCell>
              }
              {
                isAdminUser && <Table.HeaderCell
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    sortLog('username');
                  }}
                  width={1}
                >
                  用户
                </Table.HeaderCell>
              }
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('token_name');
                }}
                width={1}
              >
                令牌
              </Table.HeaderCell>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('type');
                }}
                width={1}
              >
                类型
              </Table.HeaderCell>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('model_name');
                }}
                width={2}
              >
                模型
              </Table.HeaderCell>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('prompt_tokens');
                }}
                width={1}
              >
                提示
              </Table.HeaderCell>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('completion_tokens');
                }}
                width={1}
              >
                补全
              </Table.HeaderCell>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('quota');
                }}
                width={1}
              >
                额度
              </Table.HeaderCell>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('content');
                }}
                width={isAdminUser ? 4 : 6}
              >
                详情
              </Table.HeaderCell>
              <Table.HeaderCell
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    sortLog('request');
                  }}
                  width={4}
              >
                请求
              </Table.HeaderCell>
              <Table.HeaderCell
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    sortLog('response');
                  }}
                  width={4}
              >
                响应
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {logs
              .slice(
                (activePage - 1) * ITEMS_PER_PAGE,
                activePage * ITEMS_PER_PAGE
              )
              .map((log, idx) => {
                if (log.deleted) return <></>;
                return (
                  <Table.Row key={log.id}>
                    <Table.Cell>{renderTimestamp(log.created_at)}</Table.Cell>
                    {
                      isAdminUser && (
                        <Table.Cell>{log.channel ? <Label basic>{log.channel}</Label> : ''}</Table.Cell>
                      )
                    }
                    {
                      isAdminUser && (
                        <Table.Cell>{log.username ? <Label>{log.username}</Label> : ''}</Table.Cell>
                      )
                    }
                    <Table.Cell>{log.token_name ? <Label basic>{log.token_name}</Label> : ''}</Table.Cell>
                    <Table.Cell>{renderType(log.type)}</Table.Cell>
                    <Table.Cell>{log.model_name ? <Label basic>{log.model_name}</Label> : ''}</Table.Cell>
                    <Table.Cell>{log.prompt_tokens ? log.prompt_tokens : ''}</Table.Cell>
                    <Table.Cell>{log.completion_tokens ? log.completion_tokens : ''}</Table.Cell>
                    <Table.Cell>{log.quota ? renderQuota(log.quota, 6) : ''}</Table.Cell>
                    <Table.Cell>{log.content}</Table.Cell>
                    <HoverContentCell content={log.request} />
                    <HoverContentCell content={log.response} />
                  </Table.Row>
                );
              })}
          </Table.Body>

          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell colSpan={'10'}>
                <Select
                  placeholder='选择明细分类'
                  options={LOG_OPTIONS}
                  style={{ marginRight: '8px' }}
                  name='logType'
                  value={logType}
                  onChange={(e, { name, value }) => {
                    setLogType(value);
                  }}
                />
                <Button size='small' onClick={refresh} loading={loading}>刷新</Button>
                <Pagination
                  floated='right'
                  activePage={activePage}
                  onPageChange={onPaginationChange}
                  size='small'
                  siblingRange={1}
                  totalPages={
                    Math.ceil(logs.length / ITEMS_PER_PAGE) +
                    (logs.length % ITEMS_PER_PAGE === 0 ? 1 : 0)
                  }
                />
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        </Table>
      </Segment>
    </>
  );
};

export default LogsTable;
